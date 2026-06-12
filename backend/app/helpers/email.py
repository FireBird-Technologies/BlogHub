import html
import logging

import httpx

from app.settings import settings

logger = logging.getLogger(__name__)

RESEND_ENDPOINT = "https://api.resend.com/emails"


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
        f'style="color:#dc2626;">{html.escape(str(s.get("label", "Link")))}</a> '
        f'— {html.escape(str(s.get("url", "")))}</div>'
        for s in social_links
        if s.get("url")
    ) or '<span style="color:#9ca3af;">None provided</span>'

    original_html = (
        f'<a href="{html.escape(original_url)}" style="color:#dc2626;">{html.escape(original_url)}</a>'
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
        {_row("Publication", f'<a href="{pub_url}" style="color:#dc2626;">{pub_title}</a>')}
        {_row("BlogHub URL", f'<a href="{pub_url}" style="color:#dc2626;">{pub_url}</a>')}
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
