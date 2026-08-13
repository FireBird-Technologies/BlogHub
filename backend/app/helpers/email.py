import html
import logging
import re
from datetime import timezone
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

import httpx

from app.settings import settings


logger = logging.getLogger(__name__)

RESEND_ENDPOINT = "https://api.resend.com/emails"

# UTM tag for links in the product-update emails. Mirrors the featured announcement's
# tag (same utm_source="bloghub", utm_medium="email") but its own utm_campaign="update"
# / utm_content="update_email", so clicks from an update email are distinguishable from
# the featured campaign and from on-site clicks in the site's analytics.
_UPDATE_EMAIL_UTM = {
    "utm_source": "bloghub",
    "utm_medium": "email",
    "utm_campaign": "update",
    "utm_content": "update_email",
}


def _with_update_email_utm(url: str) -> str:
    """Append the update-email UTM tag to an outbound URL.

    Preserves any query string already on the link and never overwrites a param already
    set. Falls back to the raw URL for anything that isn't a parseable absolute http(s)
    link, so a bad URL degrades to a plain link rather than breaking the send.
    """
    try:
        parts = urlsplit(url)
        if parts.scheme not in ("http", "https"):
            return url
        query = dict(parse_qsl(parts.query, keep_blank_values=True))
        for key, value in _UPDATE_EMAIL_UTM.items():
            query.setdefault(key, value)
        return urlunsplit(parts._replace(query=urlencode(query)))
    except Exception:  # noqa: BLE001
        return url


def _publication_detail_url(pub) -> str:
    """Public BlogHub detail-page URL for a publication (slug + short id)."""
    slug = re.sub(r"[^a-z0-9]+", "-", (pub.title or "").lower()).strip("-")[:60].rstrip("-")
    short_id = str(pub.id).replace("-", "")[:8].lower()
    path = f"/publications/{slug}-{short_id}" if slug else f"/publications/{short_id}"
    return f"{settings.FRONTEND_URL}{path}"


def _format_feature_announcement_time(email) -> str | None:
    """Author-facing scheduled send time, in the timezone they chose."""
    send_at = getattr(email, "scheduled_at", None)
    if send_at is None:
        return None

    tz_name = (getattr(email, "author_timezone", None) or "UTC").strip() or "UTC"
    try:
        zone = ZoneInfo(tz_name)
    except Exception:  # noqa: BLE001
        tz_name = "UTC"
        zone = timezone.utc

    if send_at.tzinfo is None:
        send_at = send_at.replace(tzinfo=timezone.utc)
    local = send_at.astimezone(zone)
    label = f"{local.strftime('%b %d, %Y, %I:%M %p').replace(' 0', ' ')} ({tz_name})"
    return html.escape(label)


def _row(label: str, value: str) -> str:
    return (
        f'<tr><td style="padding:4px 12px 4px 0;color:#6b7280;'
        f'vertical-align:top;white-space:nowrap;">{html.escape(label)}</td>'
        f'<td style="padding:4px 0;color:#111827;">{value}</td></tr>'
    )


async def send_claim_notification(
    *,
    claim_id,
    publication,
    claimer_name: str,
    claimer_email: str,
    social_links: list[dict],
    original_url: str | None,
    comment: str | None = None,
    approve_url: str | None = None,
) -> None:
    """Best-effort email to the site owner when a publication is claimed.

    Never raises: if Resend is not configured or the request fails, we log a
    warning and return so the claim itself is still persisted.
    """
    if not settings.RESEND_API_KEY or not settings.CLAIM_NOTIFY_EMAIL:
        logger.warning(
            "Claim email skipped: RESEND_API_KEY or CLAIM_NOTIFY_EMAIL not configured."
        )
        return

    socials_html = "".join(
        f'<div><a href="{html.escape(str(s.get("url", "")))}" '
        f'style="color:#111827;">{html.escape(str(s.get("label", "Link")))}</a> '
        f'— {html.escape(str(s.get("url", "")))}</div>'
        for s in social_links
        if s.get("url")
    ) or '<span style="color:#9ca3af;">None provided</span>'

    original_html = (
        f'<a href="{html.escape(original_url)}" style="color:#111827;">{html.escape(original_url)}</a>'
        if original_url
        else '<span style="color:#9ca3af;">None provided</span>'
    )

    comment_html = (
        html.escape(comment).replace("\n", "<br>")
        if comment
        else '<span style="color:#9ca3af;">None provided</span>'
    )

    pub_title = html.escape(publication.title or "")
    pub_url = html.escape(publication.url or "")
    claim_id_str = html.escape(str(claim_id))

    approve_button_html = ""
    if approve_url:
        safe_approve_url = html.escape(approve_url)
        approve_button_html = f"""
      <div style="margin-top:24px;text-align:center;">
        <a href="{safe_approve_url}"
           style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Approve &amp; Transfer Ownership
        </a>
        <p style="color:#9ca3af;font-size:11px;margin-top:10px;">
          Clicking this button will take you to a password-protected page to confirm the approval.
        </p>
      </div>"""

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#111827;font-size:18px;margin:0 0 4px;">New publication claim</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">
        Someone has claimed a publication on BlogHub. Review the details below and approve if it checks out.
      </p>
      <table style="font-size:14px;border-collapse:collapse;width:100%;">
        {_row("Publication", f'<a href="{pub_url}" style="color:#111827;">{pub_title}</a>')}
        {_row("BlogHub URL", f'<a href="{pub_url}" style="color:#111827;">{pub_url}</a>')}
        {_row("Claim ID", f'<code>{claim_id_str}</code>')}
        {_row("Claimer name", html.escape(claimer_name))}
        {_row("Claimer email", html.escape(claimer_email))}
        {_row("Original link", original_html)}
        {_row("Social profiles", socials_html)}
        {_row("Message", comment_html)}
      </table>
      {approve_button_html}
    </div>
    """

    payload = {
        "from": settings.CLAIM_FROM_EMAIL,
        "to": [settings.CLAIM_NOTIFY_EMAIL],
        "reply_to": claimer_email,
        "subject": f"BlogHub claim: {publication.title}",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend claim email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend claim email error: %s", exc)


async def send_claim_approved_notification(
    *,
    to_email: str,
    publication,
    claimer_name: str | None = None,
) -> None:
    """Best-effort email to the new owner when their claim is approved.

    Goes to the claimer (not the site owner), so it only requires RESEND_API_KEY.
    Never raises: logs a warning on misconfiguration/failure and returns.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Claim-approved email skipped: RESEND_API_KEY not configured.")
        return
    if not to_email:
        logger.warning("Claim-approved email skipped: no recipient email.")
        return

    detail_url = _publication_detail_url(publication)
    safe_detail_url = html.escape(detail_url)
    pub_title = html.escape(publication.title or "your publication")
    greeting = f"Hi {html.escape(claimer_name)}," if claimer_name and claimer_name.strip() else "Hi,"

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">{greeting}</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Good news — your claim for <strong>{pub_title}</strong> on BlogHub has been approved. You now have full access to manage and update your publication listing.
      </p>
      <div style="margin-top:24px;text-align:center;">
        <a href="{safe_detail_url}"
           style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Check it out
        </a>
      </div>
    </div>
    """

    payload = {
        "from": settings.CLAIM_FROM_EMAIL,
        "to": [to_email],
        "subject": "Your BlogHub claim was approved",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend claim-approved email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend claim-approved email error: %s", exc)


async def send_feature_purchase_notification(
    *,
    slot,
    publication,
    buyer_name: str | None,
    buyer_email: str | None,
) -> None:
    """Best-effort review request to the site owner when a featured slot is paid for.

    Goes to the owner ONLY — no CC to the buyer, because it carries the approve and
    reject buttons. The buyer is told separately (see
    `send_feature_pending_review_notification`).

    Never raises — the payment is already recorded by the time we get here, and a
    Resend outage must not make the Stripe webhook fail.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Feature purchase email skipped: RESEND_API_KEY not configured.")
        return

    detail_url = _publication_detail_url(publication)
    pub_title = html.escape(publication.title or "")
    amount = f"${slot.amount_cents / 100:,.2f} {slot.currency.upper()}"
    dates = f"{slot.start_date.isoformat()} → {slot.end_date.isoformat()}"
    review_url = html.escape(f"{settings.FRONTEND_URL}/admin/approve-featured?slot_id={slot.id}")

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#111827;font-size:18px;margin:0 0 4px;">Featured slot purchased — needs review</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">
        This booking is <strong>paid but not live</strong>. It will only appear on the site
        once you approve it. Rejecting it releases the dates so someone else can book them
        (refund the payment in the Stripe dashboard).
      </p>
      <table style="font-size:14px;border-collapse:collapse;width:100%;">
        {_row("Publication", f'<a href="{html.escape(detail_url)}" style="color:#111827;">{pub_title}</a>')}
        {_row("Link", f'<a href="{html.escape(publication.url or "")}" style="color:#111827;">{html.escape(publication.url or "—")}</a>')}
        {_row("Buyer", html.escape(buyer_name or "—"))}
        {_row("Buyer email", html.escape(buyer_email or "—"))}
        {_row("Featured dates", html.escape(dates))}
        {_row("Duration", f"{slot.duration_days} days")}
        {_row("Amount paid", html.escape(amount))}
        {_row("Stripe session", f'<code>{html.escape(str(slot.stripe_session_id or "—"))}</code>')}
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="{review_url}"
           style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Review this booking
        </a>
        <p style="color:#9ca3af;font-size:11px;margin-top:10px;">
          Opens a password-protected page where you can approve or reject it.
        </p>
      </div>
    </div>
    """

    payload = {
        "from": settings.FEATURE_FROM_EMAIL,
        "to": [settings.FEATURE_NOTIFY_EMAIL],
        "subject": f"BlogHub feature needs review: {publication.title}",
        "html": body,
    }
    if buyer_email:
        payload["reply_to"] = buyer_email

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend feature purchase email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend feature purchase email error: %s", exc)


async def send_feature_pending_review_notification(
    *,
    to_email: str | None,
    buyer_name: str | None,
    publication,
    slot,
    announcement_email=None,
) -> None:
    """Receipt to the buyer: we have their money, and their booking is under review.

    Split out from the owner's email because that one carries the approve/reject
    buttons. Never raises.
    """
    if not settings.RESEND_API_KEY or not to_email:
        return

    pub_title = html.escape(publication.title or "your publication")
    dates = html.escape(f"{slot.start_date.isoformat()} → {slot.end_date.isoformat()}")
    greeting = f"Hi {html.escape(buyer_name)}," if buyer_name and buyer_name.strip() else "Hi,"
    send_time = _format_feature_announcement_time(announcement_email)
    send_time_html = (
        f"""
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Your announcement email is set to send at <strong>{send_time}</strong>, after our team
        approves the booking.
      </p>"""
        if send_time
        else ""
    )

    profile_url = html.escape(f"{settings.FRONTEND_URL}/profile")

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">{greeting}</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Thanks — we&#39;ve received your payment to feature <strong>{pub_title}</strong> on BlogHub
        for <strong>{dates}</strong>.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        We&#39;ve saved the announcement email you wrote for BlogHub subscribers. Nothing is sent
        until our team approves the booking.
      </p>
      {send_time_html}
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Our team then approves the booking, and your publication goes live at the top of the home
        page and dashboard on your start date. We&#39;ll email you when it&#39;s approved.
      </p>
      <div style="margin-top:24px;text-align:center;">
        <a href="{profile_url}"
           style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          View your booking
        </a>
      </div>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:20px 0 0;">
        If anything looks wrong, contact us at
        <a href="mailto:{html.escape(settings.FEATURE_NOTIFY_EMAIL)}" style="color:#9ca3af;">{html.escape(settings.FEATURE_NOTIFY_EMAIL)}</a>.
      </p>
    </div>
    """

    payload = {
        "from": settings.FEATURE_FROM_EMAIL,
        "to": [to_email],
        "reply_to": settings.FEATURE_NOTIFY_EMAIL,
        "subject": "Your BlogHub feature is booked",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend pending-review email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend pending-review email error: %s", exc)


async def send_feature_approved_notification(
    *,
    to_email: str | None,
    author_name: str | None,
    publication,
    slot,
    announcement_pending: bool,
    announcement_email=None,
) -> None:
    """Tell the author their booking has been approved by our team."""
    if not settings.RESEND_API_KEY or not to_email:
        return

    pub_title = html.escape(publication.title or "your publication")
    profile_url = html.escape(f"{settings.FRONTEND_URL}/profile")
    greeting = f"Hi {html.escape(author_name)}," if author_name and author_name.strip() else "Hi,"
    start = html.escape(slot.start_date.isoformat())
    send_time = _format_feature_announcement_time(announcement_email)

    # Only nag them about the announcement if they still have to approve it.
    announcement_html = (
        f"""
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        One thing still needs you: the announcement email we drafted for your publication is
        waiting for you to finalise it. Until you do, it won&#39;t be sent to subscribers.
      </p>
      <div style="margin-top:24px;text-align:center;">
        <a href="{profile_url}"
           style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Finalise your announcement
        </a>
      </div>"""
        if announcement_pending
        else f"""
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Your announcement email is approved and scheduled — it goes out to BlogHub subscribers at
        <strong>{send_time}</strong>. Nothing more for you to do.
      </p>"""
        if send_time
        else f"""
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Your announcement email is approved and scheduled — it goes out to BlogHub subscribers
        at the scheduled time. Nothing more for you to do.
      </p>"""
    )

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">{greeting}</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Good news — your featured booking for <strong>{pub_title}</strong> has been approved. It
        goes live at the top of the BlogHub home page and dashboard on <strong>{start}</strong>.
      </p>
      {announcement_html}
    </div>
    """

    payload = {
        "from": settings.FEATURE_FROM_EMAIL,
        "to": [to_email],
        "reply_to": settings.FEATURE_NOTIFY_EMAIL,
        "subject": f"Your BlogHub feature is approved: {publication.title}",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend draft-ready email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend draft-ready email error: %s", exc)


async def send_feature_rejected_notification(
    *,
    to_email: str | None,
    author_name: str | None,
    publication,
    slot,
) -> None:
    """Tell the buyer their paid booking was cancelled by our team, and that a refund
    is on its way. The refund itself is issued by hand in the Stripe dashboard."""
    if not settings.RESEND_API_KEY or not to_email:
        return

    pub_title = html.escape(publication.title or "your publication")
    greeting = f"Hi {html.escape(author_name)}," if author_name and author_name.strip() else "Hi,"
    dates = html.escape(f"{slot.start_date.isoformat()} → {slot.end_date.isoformat()}")
    contact_email = html.escape(settings.FEATURE_NOTIFY_EMAIL)

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">{greeting}</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        We&#39;re sorry to let you know that your featured booking for <strong>{pub_title}</strong>
        ({dates}) has been cancelled by our review team, so it won&#39;t run.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        You will be refunded your paid amount. Refunds are issued back to your original payment method
        and usually arrive within <strong>3–4 business days</strong>, and always within
        <strong>10 days</strong> at the latest.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        If you have any questions or the refund doesn&#39;t arrive in that time, just reach out to us at
        <a href="mailto:{contact_email}" style="color:#dc2626;text-decoration:none;">{contact_email}</a>
        and we&#39;ll help sort it out.
      </p>
    </div>
    """

    payload = {
        "from": settings.FEATURE_FROM_EMAIL,
        "to": [to_email],
        "reply_to": settings.FEATURE_NOTIFY_EMAIL,
        "subject": f"Your BlogHub feature booking was cancelled: {publication.title}",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend feature-rejected email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend feature-rejected email error: %s", exc)


async def send_feature_expiring_notification(
    *,
    to_email: str | None,
    author_name: str | None,
    publication,
    slot,
    renew_url: str,
) -> None:
    """Tell the author, on the morning of the last day, that their run ends today.

    Leads with what the placement actually earned them — those two numbers are the
    honest argument for booking again, and they are the one thing the author can't
    look up once the run is over and the card is gone.

    Sent from the update-email address rather than the featured one, so replies land
    with the team that handles product mail.
    """
    if not settings.RESEND_API_KEY or not to_email:
        return

    pub_title = html.escape(publication.title or "your publication")
    greeting = f"Hi {html.escape(author_name)}," if author_name and author_name.strip() else "Hi,"
    dates = html.escape(f"{slot.start_date.isoformat()} → {slot.end_date.isoformat()}")
    safe_renew_url = html.escape(renew_url)

    stats_html = _row("Run dates", dates) + _row("Readers reached", f"{slot.impression_count:,}") + _row(
        "Clicks to your publication", f"{slot.click_count:,}"
    )

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">{greeting}</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Your featured run for <strong>{pub_title}</strong> ends <strong>today</strong>. After
        tonight it comes off the top of the BlogHub home page and dashboard.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">
        Here&#39;s what the slot did for you so far:
      </p>
      <table style="font-size:14px;border-collapse:collapse;margin:0 0 20px;">
        {stats_html}
      </table>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Want to keep going? Extend your feature slot by booking another one now. You can
        reserve the earliest available slot, and schedule another announcement email as well.
      </p>
      <div style="margin-top:24px;text-align:center;">
        <a href="{safe_renew_url}"
           style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Extend your feature
        </a>
      </div>
    </div>
    """

    payload = {
        "from": settings.FEATURE_FROM_EMAIL,
        "to": [to_email],
        "reply_to": settings.UPDATE_EMAIL_REPLY_TO,
        "subject": f"Your BlogHub feature ends today: {publication.title}",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend feature-expiring email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend feature-expiring email error: %s", exc)


async def send_publication_invite(
    *,
    to_email: str,
    sender_name: str | None,
    publication,
) -> bool:
    """Invite one person to a publication on BlogHub. Returns True if it went out.

    Goes to an address someone typed into a share box, so it is deliberately plain:
    who sent it, what they're recommending, one button, and a line about what BlogHub
    is. Reports success because the sender is waiting to be told whether it worked.

    Sent from the invite address on our own authenticated domain, never as the
    inviter — we send on their behalf, so nothing here depends on their mail setup or
    risks failing SPF/DKIM for their domain. Replies go to the team inbox.
    """
    if not settings.RESEND_API_KEY or not to_email:
        logger.warning("Publication invite skipped: RESEND_API_KEY or recipient missing.")
        return False

    pub_title = html.escape(publication.title or "a publication")
    pub_url = html.escape(_with_update_email_utm(_publication_detail_url(publication)))
    who = html.escape((sender_name or "").strip()) or "Someone"
    description = html.escape((publication.description or "").strip())
    description_html = (
        f'<p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 20px;">{description}</p>'
        if description
        else ""
    )

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        <strong>{who}</strong> thought you&#39;d enjoy <strong>{pub_title}</strong> on BlogHub.
      </p>
      {description_html}
      <div style="margin:0 0 24px;">
        <a href="{pub_url}"
           style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Read {pub_title}
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
        BlogHub is a directory of independent publications. Join to upvote the ones you like
        and keep up with new publications as they&#39;re published.
      </p>
    </div>
    """

    payload = {
        "from": settings.INVITE_NOTIFY_EMAIL,
        "to": [to_email],
        "reply_to": settings.UPDATE_EMAIL_REPLY_TO,
        "subject": f"{who} shared {publication.title} with you",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend publication invite failed (%s): %s", resp.status_code, resp.text)
            return False
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend publication invite error: %s", exc)
        return False


async def send_featured_marketing_email(
    *,
    to_email: str,
    subject: str,
    body: str,
    button_text: str,
    link_url: str,
    unsubscribe_token: str,
) -> None:
    """The announcement itself, to one subscriber.

    The author writes and approves plain text; we wrap it in minimal HTML here so the
    publication link is a single button, labelled with whatever text the author chose
    for it. Deliberately no cover image, title card, or category/author line — the
    message is the author's own words plus one button, nothing else competing for
    attention. The body is escaped, so nothing an author types can inject markup, and
    the button and the unsubscribe footer are rendered here rather than stored — an
    author editing the draft cannot break or delete either.

    Sent from the newsletter address, which is the sender subscribers already
    recognise. Never raises: one bad address must not stop the rest of the blast.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Featured marketing email skipped: RESEND_API_KEY not configured.")
        return

    unsubscribe_url = (
        f"{settings.BACKEND_URL}/api/users/unsubscribe-digest?token={unsubscribe_token}"
    )

    # The author's plain text, escaped and with newlines preserved.
    body_html = html.escape(body).replace("\n", "<br>")
    # link_url already carries the marketing-email UTM tag (added by the caller via
    # _with_marketing_email_utm) — the button is the only outbound link here.
    safe_link_url = html.escape(link_url)
    safe_button_text = html.escape(button_text)

    html_body = (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>'
        '<body style="margin:0;padding:0;background:#fff;'
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">"
        '<div style="max-width:520px;margin:48px auto;padding:0 24px;text-align:left;">'
        f'<p style="margin:0 0 28px;font-size:15px;color:#111827;line-height:1.7;">{body_html}</p>'
        f'<a href="{safe_link_url}" style="display:inline-block;background:#dc2626;color:#ffffff;'
        "font-size:14px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:8px;\">"
        f"{safe_button_text}</a>"
        '<p style="margin:32px 0 0;font-size:12px;color:#9ca3af;">'
        f'<a href="{html.escape(unsubscribe_url)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>'
        "</p>"
        "</div></body></html>"
    )

    payload = {
        "from": settings.NEWSLETTER_FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning(
                "Resend featured marketing email failed (%s): %s", resp.status_code, resp.text
            )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend featured marketing email error: %s", exc)


async def send_update_email(
    *,
    to_email: str,
    name: str,
    subject: str,
    body: str,
    unsubscribe_token: str,
) -> bool:
    """A product-update campaign email, to one subscriber.

    Styled to read like a personal note from Arslan rather than a marketing template:
    the greeting and the admin's body render as plain text (a `pre` block with the
    system font), followed by a thin rule and a small muted-grey footer with a
    "Visit us at bloghub.app" line and a "click here" unsubscribe link. A plain-text
    alternative is sent alongside for clients that prefer it. Sent from
    `UPDATE_EMAIL_FROM_EMAIL` (Arslan personally), not the newsletter address.

    Unlike most helpers in this module, this returns True/False rather than swallowing
    the outcome silently: the batch loop records `sent`/`failed` per recipient, so it
    needs to know. It still never raises — a single bad address must not abort the batch.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Update email skipped: RESEND_API_KEY not configured.")
        return False

    unsubscribe_url = (
        f"{settings.BACKEND_URL}/api/users/unsubscribe-digest?token={unsubscribe_token}"
    )

    first_name = (name or "").split()[0] if name else "there"

    # Tag the "Visit us at" link so clicks from update emails are attributable and can
    # be told apart from the featured-announcement campaign in the site's analytics.
    site_url = _with_update_email_utm("https://bloghub.app")

    text_body = (
        f"Hi {first_name},\n\n"
        f"{body}\n\n"
        f"---\n"
        f"Visit us at {site_url}\n"
        f"To unsubscribe from these emails, visit: {unsubscribe_url}\n"
    )

    html_body = (
        f"<pre style='font-family:inherit;font-size:15px;white-space:pre-wrap;margin:0;'>"
        f"Hi {html.escape(first_name)},\n\n"
        f"{html.escape(body)}"
        f"</pre>"
        f"<hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0;'/>"
        f"<p style='font-size:12px;color:#9ca3af;margin:0 0 6px;'>"
        f"Visit us at <a href='{html.escape(site_url)}' style='color:#9ca3af;text-decoration:underline;text-decoration-color:#9ca3af;'>bloghub.app</a>"
        f"</p>"
        f"<p style='font-size:12px;color:#9ca3af;margin:0;'>"
        f"To unsubscribe from these emails, "
        f"<a href='{html.escape(unsubscribe_url)}' style='color:#9ca3af;text-decoration:underline;text-decoration-color:#9ca3af;'>click here</a>."
        f"</p>"
    )

    payload = {
        "from": settings.UPDATE_EMAIL_FROM_EMAIL,
        "to": [to_email],
        "reply_to": settings.UPDATE_EMAIL_REPLY_TO,
        "subject": subject,
        "html": html_body,
        "text": text_body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend update email failed (%s): %s", resp.status_code, resp.text)
            return False
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend update email error: %s", exc)
        return False


async def send_support_request(
    *,
    from_name: str,
    from_email: str,
    subject: str,
    message: str,
) -> bool:
    """Support enquiry from the featured-slot contact form. Returns True if sent.

    Unlike the other helpers here this reports failure, because the sender is waiting
    on the result and needs to be told if their message didn't get through.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Support email skipped: RESEND_API_KEY not configured.")
        return False

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#111827;font-size:18px;margin:0 0 4px;">Support request</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">
        Sent from the BlogHub featured-slot contact form.
      </p>
      <table style="font-size:14px;border-collapse:collapse;width:100%;">
        {_row("From", html.escape(from_name or "—"))}
        {_row("Email", html.escape(from_email))}
        {_row("Subject", html.escape(subject))}
      </table>
      <div style="margin-top:16px;padding:14px;background:#f9fafb;border-radius:8px;
                  color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;">
        {html.escape(message)}
      </div>
    </div>
    """

    payload = {
        "from": settings.FEATURE_FROM_EMAIL,
        "to": [settings.FEATURE_NOTIFY_EMAIL],
        "reply_to": from_email,
        "subject": f"BlogHub support: {subject}",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend support email failed (%s): %s", resp.status_code, resp.text)
            return False
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend support email error: %s", exc)
        return False


async def send_weekly_digest(
    to_email: str,
    publications: list,
    unsubscribe_token: str,
    name: str | None = None,
    *,
    subject: str = "Top 5 posts this week",
    intro: str = "Here’s what was popular on BlogHub this week:",
    utm_content: str = "weekly_digest",
) -> None:
    """Best-effort weekly digest email listing publications.

    Used for both the "top" and "underrated" weekly digests — they share the same
    layout and unsubscribe flow, differing only in `subject` and `intro`.

    Never raises: if Resend is not configured or the request fails, we log a
    warning and return.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Weekly digest email skipped: RESEND_API_KEY not configured.")
        return

    def _publication_url(pub) -> str:
        return html.escape(_publication_detail_url(pub))

    frontend_url = html.escape(settings.FRONTEND_URL)

    def _row(i: int, pub) -> str:
        pub_url = _publication_url(pub)
        title = html.escape(pub.title or "")
        raw_desc = (pub.description or "").strip()
        desc = html.escape(raw_desc[:180].rsplit(" ", 1)[0] + "…") if len(raw_desc) > 180 else html.escape(raw_desc)
        desc_block = f'<p style="margin:6px 0 10px;font-size:14px;color:#374151;line-height:1.6;">{desc}</p>' if desc else '<p style="margin:0 0 10px;"></p>'
        return (
            f'<tr><td style="padding:20px 0;">'
            f'<p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111827;line-height:1.5;">'
            f'&rarr; <a href="{pub_url}" style="color:#111827;text-decoration:none;">{title}</a>'
            f'</p>'
            f'{desc_block}'
            f'<a href="{pub_url}" style="font-size:13px;color:#111827;text-decoration:underline;">Read the full post</a>'
            f'</td></tr>'
        )

    rows = "".join(_row(i, pub) for i, pub in enumerate(publications))

    unsubscribe_url = html.escape(
        f"{settings.BACKEND_URL}/api/users/unsubscribe-digest?token={unsubscribe_token}"
    )

    body = (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>'
        '<body style="margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
        '<div style="max-width:520px;margin:48px auto;padding:0 24px;text-align:left;">'
        f'<p style="margin:0 0 4px;font-size:15px;color:#111827;line-height:1.6;">Hey {html.escape(name) if name and name.strip() else "there"},</p>'
        f'<p style="margin:8px 0 16px;font-size:15px;color:#111827;line-height:1.6;">{html.escape(intro)}</p>'
        f'<table cellpadding="0" cellspacing="0" border="0" width="100%">{rows}</table>'
        '<p style="margin:32px 0 0;font-size:14px;color:#111827;line-height:1.6;">'
        f'Reach a 4x wider audience by using <a href="https://blog2video.app?utm_source=bloghub&amp;utm_medium=email&amp;utm_campaign=blog2video&amp;utm_content={html.escape(utm_content)}" style="color:#111827;text-decoration:underline;">Blog2Video</a>'
        '</p>'
        f'<p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">'
        f'<a href="{unsubscribe_url}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>'
        '</p>'
        '</div></body></html>'
    )

    payload = {
        "from": settings.NEWSLETTER_FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": body,
    }

    logger.info("Weekly digest HTML size: %d bytes", len(body.encode()))

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend weekly digest email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend weekly digest email error: %s", exc)


async def send_blog2video_promo(
    to_email: str,
    unsubscribe_token: str,
    name: str | None = None,
) -> None:
    """Best-effort Blog2Video promo email.

    Shares the same minimal, no-frills layout and unsubscribe flow as the weekly
    digest. Never raises: if Resend is not configured or the request fails, we log
    a warning and return.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Blog2Video promo email skipped: RESEND_API_KEY not configured.")
        return

    unsubscribe_url = html.escape(
        f"{settings.BACKEND_URL}/api/users/unsubscribe-digest?token={unsubscribe_token}"
    )
    greeting = html.escape(name) if name and name.strip() else "there"

    body = (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>'
        '<body style="margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
        '<div style="max-width:520px;margin:48px auto;padding:0 24px;text-align:left;">'
        f'<p style="margin:0 0 16px;font-size:15px;color:#111827;line-height:1.6;">Hey {greeting},</p>'
        '<p style="margin:0 0 16px;font-size:15px;color:#111827;line-height:1.6;">'
        '<a href="https://blog2video.app?utm_source=bloghub&amp;utm_medium=email&amp;utm_campaign=blog2video&amp;utm_content=blog2video_promo" style="color:#111827;text-decoration:underline;">Blog2video.app</a> '
        'turns your blog posts into branded videos and helps you grow your external traffic by 4x.</p>'
        '<p style="margin:0 0 16px;font-size:15px;color:#111827;line-height:1.6;">'
        'Users report a 70% increase in new subscribers in the first week of sharing video content.</p>'
        '<p style="margin:0 0 16px;font-size:15px;color:#111827;line-height:1.6;">'
        'You get a custom video in your own branding, with your own voice, made from a post you already wrote.</p>'
        '<p style="margin:0 0 16px;font-size:15px;color:#111827;line-height:1.6;">'
        'Give it a try at <a href="https://blog2video.app?utm_source=bloghub&amp;utm_medium=email&amp;utm_campaign=blog2video&amp;utm_content=blog2video_promo" style="color:#111827;text-decoration:underline;">blog2video.app</a></p>'
        '<p style="margin:24px 0 0;font-size:15px;color:#111827;line-height:1.6;">Arslan, bloghub.app</p>'
        f'<p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">'
        f'<a href="{unsubscribe_url}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>'
        '</p>'
        '</div></body></html>'
    )

    payload = {
        "from": settings.NO_REPLY_FROM_EMAIL,
        "to": [to_email],
        "subject": "Get 4x wider reach for your blog",
        "html": body,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning("Resend Blog2Video promo email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend Blog2Video promo email error: %s", exc)
