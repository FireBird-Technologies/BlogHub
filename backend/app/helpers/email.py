import html
import logging
import re

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


async def send_weekly_digest(to_email: str, publications: list, unsubscribe_token: str) -> None:
    """Best-effort weekly digest email listing the top publications.

    Never raises: if Resend is not configured or the request fails, we log a
    warning and return.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Weekly digest email skipped: RESEND_API_KEY not configured.")
        return

    def _publication_url(pub) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", (pub.title or "").lower()).strip("-")[:60].rstrip("-")
        short_id = str(pub.id).replace("-", "")[:8].lower()
        path = f"/publications/{slug}-{short_id}" if slug else f"/publications/{short_id}"
        return html.escape(f"{settings.FRONTEND_URL}{path}")

    frontend_url = html.escape(settings.FRONTEND_URL)

    def _card(i: int, pub) -> str:
        pub_url = _publication_url(pub)
        title = html.escape(pub.title or "")
        category = html.escape(pub.category or "")
        author_name = html.escape(pub.author.name if pub.author else "")
        rank = i + 1

        if pub.image_url:
            safe_img = html.escape(pub.image_url)
            image_block = f'<a href="{pub_url}" style="display:block;text-decoration:none;line-height:0;"><img src="{safe_img}" alt="{title}" width="560" style="width:100%;height:180px;object-fit:cover;display:block;border-radius:10px 10px 0 0;border:0;" /></a>'
        else:
            image_block = f'<a href="{pub_url}" style="display:block;text-decoration:none;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:100px;background:#f9fafb;border-radius:10px 10px 0 0;border-bottom:1px solid #f3f4f6;"></td></tr></table></a>'

        author_initial = author_name[0].upper() if author_name else "?"
        if pub.author and pub.author.avatar_url:
            avatar_html = f'<img src="{html.escape(pub.author.avatar_url)}" alt="{author_name}" width="20" height="20" style="width:20px;height:20px;border-radius:50%;object-fit:cover;display:inline-block;vertical-align:middle;border:0;" />'
        else:
            avatar_html = f'<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#dc2626;color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:20px;vertical-align:middle;">{author_initial}</span>'

        return f"""
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:16px;">
          <tr><td style="border-radius:12px;overflow:hidden;">
            {image_block}
            <div style="padding:14px 16px 12px;">
              <span style="font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.2px;">{rank}.&nbsp;&nbsp;</span><span style="display:inline-block;font-size:11px;font-weight:600;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:20px;padding:2px 8px;">{category}</span>
              <a href="{pub_url}" style="text-decoration:none;display:block;margin-top:8px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#111827;line-height:1.45;">{title}</p>
              </a>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;border-top:1px solid #f3f4f6;padding-top:10px;">
                <tr>
                  <td style="vertical-align:middle;">
                    {avatar_html}<span style="font-size:12px;color:#6b7280;margin-left:6px;vertical-align:middle;">{author_name}</span>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:12px;color:#dc2626;vertical-align:middle;">&#9650;</span>
                    <span style="font-size:12px;font-weight:600;color:#111827;vertical-align:middle;margin-left:3px;">{pub.upvote_count}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td></tr>
        </table>"""

    items_html = "".join(_card(i, pub) for i, pub in enumerate(publications))
    unsubscribe_url = html.escape(
        f"{settings.BACKEND_URL}/api/users/unsubscribe-digest?token={unsubscribe_token}"
    )

    body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>BlogHub Weekly Digest</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;">
    <tr>
      <td align="center" style="padding:32px 16px 48px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="{frontend_url}" style="text-decoration:none;">
                <span style="font-size:20px;font-weight:800;color:#dc2626;letter-spacing:-0.5px;">BlogHub</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">This week&#8217;s top posts</p>
              <p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">Most upvoted in the last 7 days</p>
            </td>
          </tr>
          <tr><td>{items_html}</td></tr>
          <tr>
            <td align="center" style="padding:4px 0 28px;">
              <a href="{frontend_url}"
                 style="display:inline-block;background:#dc2626;color:#ffffff;
                        font-size:13px;font-weight:600;text-decoration:none;
                        padding:11px 28px;border-radius:8px;">
                View all posts &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                <a href="{unsubscribe_url}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="{frontend_url}" style="color:#9ca3af;text-decoration:underline;">BlogHub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    payload = {
        "from": settings.NEWSLETTER_FROM_EMAIL,
        "to": [to_email],
        "subject": "BlogHub Weekly Digest: Top 5 posts this week",
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
            logger.warning("Resend weekly digest email failed (%s): %s", resp.status_code, resp.text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resend weekly digest email error: %s", exc)
