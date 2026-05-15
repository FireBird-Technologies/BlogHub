"""DeepSeek (via OpenRouter) expansion of scraped descriptions."""

from __future__ import annotations

import logging

import httpx

from app.settings import settings

logger = logging.getLogger(__name__)

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


async def enrich_scraped_description(
    *,
    url: str,
    title: str | None,
    description: str | None,
) -> str | None:
    """
    Return a longer plain-text summary, or None to keep the original description.
    Never raises; logs and returns None on any failure.
    """
    key = settings.OPEN_ROUTER_KEY
    if not key:
        return None

    prompt = f"""You help summarize articles for a reading list.

Page URL: {url}
Title: {title or "(unknown)"}
Existing meta description or snippet: {description or "(none)"}

Write 2 to 4 sentences of plain text only: what the article covers and why it might interest a technical or curious reader. No markdown, no bullet points, no title line, no quotes around the whole answer."""

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "max_tokens": 200,
        "temperature": 0.4,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.FRONTEND_URL,
        "X-Title": "BlogHub",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(_OPENROUTER_URL, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
        text = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            or ""
        ).strip()
        if not text:
            return None
        if len(text) > 6000:
            text = text[:6000]
        return text
    except httpx.TimeoutException:
        logger.warning("OpenRouter description enrichment timed out")
        return None
    except Exception as exc:
        logger.warning("OpenRouter description enrichment failed: %s", exc)
        return None
