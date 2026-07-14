import html
import logging
import re

import httpx

from app.settings import settings


logger = logging.getLogger(__name__)

RESEND_ENDPOINT = "https://api.resend.com/emails"


def _publication_detail_url(pub) -> str:
    """Public BlogHub detail-page URL for a publication (slug + short id)."""
    slug = re.sub(r"[^a-z0-9]+", "-", (pub.title or "").lower()).strip("-")[:60].rstrip("-")
    short_id = str(pub.id).replace("-", "")[:8].lower()
    path = f"/publications/{slug}-{short_id}" if slug else f"/publications/{short_id}"
    return f"{settings.FRONTEND_URL}{path}"


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

    profile_url = html.escape(f"{settings.FRONTEND_URL}/profile")

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">{greeting}</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Thanks — we&#39;ve received your payment to feature <strong>{pub_title}</strong> on BlogHub
        for <strong>{dates}</strong>.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        <strong>One thing to do.</strong> We&#39;ve drafted an announcement email about your
        publication to send to BlogHub subscribers. Open your profile, read it through, change any
        of the wording, then <strong>finalise</strong> it. Nothing is sent until you do.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Our team then approves the booking, and your publication goes live at the top of the home
        page and dashboard on your start date. We&#39;ll email you when it&#39;s approved.
      </p>
      <div style="margin-top:24px;text-align:center;">
        <a href="{profile_url}"
           style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Finalise your announcement
        </a>
      </div>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:20px 0 0;">
        If anything looks wrong, just reply to this email.
      </p>
    </div>
    """

    payload = {
        "from": settings.FEATURE_FROM_EMAIL,
        "to": [to_email],
        "reply_to": settings.FEATURE_NOTIFY_EMAIL,
        "subject": "Your BlogHub feature is booked — approve your announcement",
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
) -> None:
    """Tell the author their booking has been approved by our team."""
    if not settings.RESEND_API_KEY or not to_email:
        return

    pub_title = html.escape(publication.title or "your publication")
    profile_url = html.escape(f"{settings.FRONTEND_URL}/profile")
    greeting = f"Hi {html.escape(author_name)}," if author_name and author_name.strip() else "Hi,"
    start = html.escape(slot.start_date.isoformat())

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
        Your announcement email is approved and scheduled — it goes out to BlogHub subscribers
        a day after your publication goes live. Nothing more for you to do.
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


async def send_featured_marketing_email(
    *,
    to_email: str,
    subject: str,
    body: str,
    link_title: str,
    link_url: str,
    category: str | None = None,
    author_name: str | None = None,
    image_url: str | None = None,
    unsubscribe_token: str,
) -> None:
    """The announcement itself, to one subscriber.

    The author writes and approves plain text; we wrap it in minimal HTML here so the
    publication's *title* can be the clickable link rather than a bare URL. The body
    is escaped, so nothing an author types can inject markup, and the link and the
    unsubscribe footer are rendered here rather than stored — an author editing the
    draft cannot break or delete either.

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
    safe_link_url = html.escape(link_url)
    safe_link_title = html.escape(link_title)

    # A small card for the publication: cover image, title, then its details. Every
    # part is optional — a publication with no image or no category simply omits that
    # row rather than rendering an empty one.
    image_html = (
        f'<a href="{safe_link_url}">'
        f'<img src="{html.escape(image_url)}" alt="" width="100%"'
        ' style="display:block;width:100%;max-width:472px;height:auto;border-radius:8px;'
        'border:1px solid #e5e7eb;margin:0 0 14px;"></a>'
        if image_url
        else ""
    )

    meta_bits = []
    if category:
        meta_bits.append(html.escape(category))
    if author_name:
        meta_bits.append(f"by {html.escape(author_name)}")
    meta_html = (
        f'<p style="margin:0 0 10px;font-size:13px;color:#6b7280;">{" &middot; ".join(meta_bits)}</p>'
        if meta_bits
        else ""
    )

    html_body = (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>'
        '<body style="margin:0;padding:0;background:#fff;'
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">"
        '<div style="max-width:520px;margin:48px auto;padding:0 24px;text-align:left;">'
        f'<p style="margin:0 0 28px;font-size:15px;color:#111827;line-height:1.7;">{body_html}</p>'
        '<div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;">'
        f"{image_html}"
        f"{meta_html}"
        f'<p style="margin:0 0 14px;font-size:17px;font-weight:700;line-height:1.4;">'
        f'<a href="{safe_link_url}" style="color:#111827;text-decoration:none;">{safe_link_title}</a>'
        "</p>"
        f'<a href="{safe_link_url}" style="display:inline-block;background:#dc2626;color:#ffffff;'
        "font-size:14px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:8px;\">"
        "Click to read the full publication</a>"
        "</div>"
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
