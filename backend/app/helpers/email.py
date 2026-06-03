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

    verify_sql = (
        "UPDATE publication_claims\n"
        "SET status = 'verified', verified_at = now()\n"
        f"WHERE id = '{claim_id_str}';"
    )

    body = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#111827;font-size:18px;margin:0 0 4px;">New publication claim</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">
        Someone has claimed a publication on BlogHub. Review the details below, then verify it
        manually in the database if it checks out.
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
      <p style="color:#374151;font-size:13px;margin:20px 0 6px;font-weight:600;">To verify this claim, run:</p>
      <pre style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:12px;
                  font-size:12px;color:#111827;overflow-x:auto;white-space:pre-wrap;">{html.escape(verify_sql)}</pre>
      <p style="color:#9ca3af;font-size:12px;margin-top:12px;">
        Run this in the Neon SQL editor. To undo, set <code>status='pending', verified_at=NULL</code>.
      </p>
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
