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
