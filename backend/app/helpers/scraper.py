import logging

import httpx

from app.helpers.url_normalize import normalize_link_url, normalize_publication_url
from app.schemas.scraper import ScrapeResult
from app.settings import settings

logger = logging.getLogger(__name__)

_FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape"


def _canonical_url(url: str, mode: str = "publication") -> str:
    # Resolve to the final URL Firecrawl should fetch / we should store: regular
    # publications collapse to their base site, while Medium/LinkedIn keep their
    # publication-identifying path so the post stays reachable. Featured "link"
    # mode always keeps the full path since it targets a specific page.
    normalizer = normalize_link_url if mode == "link" else normalize_publication_url
    return normalizer(url) or url


def _pick(meta: dict, *keys: str) -> str | None:
    for key in keys:
        val = meta.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
        if isinstance(val, list) and val:
            first = val[0]
            if isinstance(first, str) and first.strip():
                return first.strip()
    return None


async def scrape_with_firecrawl(url: str, mode: str = "publication") -> ScrapeResult:
    """
    Scrape OG-style metadata via Firecrawl. Returns ScrapeResult(url=...) with
    available fields populated, or an empty result on any failure.
    """
    canonical = _canonical_url(url, mode)

    if not settings.FIRECRAWL_API_KEY:
        logger.warning("FIRECRAWL_API_KEY not configured; returning empty scrape result")
        return ScrapeResult(url=canonical)

    payload = {
        "url": canonical,
        "formats": ["markdown"],
        "onlyMainContent": True,
    }
    headers = {
        "Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(_FIRECRAWL_URL, headers=headers, json=payload)
            resp.raise_for_status()
            body = resp.json()
    except httpx.TimeoutException:
        logger.warning("Firecrawl timed out for %s", canonical)
        return ScrapeResult(url=canonical)
    except Exception as exc:
        logger.warning("Firecrawl failed for %s: %s", canonical, exc)
        return ScrapeResult(url=canonical)

    data = body.get("data") or {}
    meta = data.get("metadata") or {}

    title = _pick(meta, "ogTitle", "twitterTitle", "title")
    description = _pick(meta, "ogDescription", "twitterDescription", "description")
    image_url = _pick(meta, "ogImage", "twitterImage", "image")
    source = _pick(meta, "sourceURL", "url") or canonical

    return ScrapeResult(
        url=_canonical_url(source, mode),
        title=title,
        description=description,
        image_url=image_url,
    )
