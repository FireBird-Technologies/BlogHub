from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from app.helpers.gemini_description import enrich_scraped_description
from app.helpers.scraper import fetch_url, parse_og_tags
from app.settings import settings
from app.schemas.scraper import ScrapeResult

router = APIRouter(tags=["scraper"])


@router.get("/scrape", response_model=ScrapeResult)
async def scrape_url(url: str = Query(..., description="URL to scrape")):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="URL must start with http:// or https://",
        )

    try:
        html = await fetch_url(url)
        result = parse_og_tags(html, url)
        if settings.GEMINI_API_KEY:
            enriched = await enrich_scraped_description(
                url=url,
                title=result.title,
                description=result.description,
            )
            if enriched:
                result = result.model_copy(update={"description": enriched})
        return result
    except httpx.TimeoutException:
        # Return partial result instead of 500
        return ScrapeResult(url=url)
    except httpx.HTTPStatusError as exc:
        return ScrapeResult(url=url)
    except Exception:
        return ScrapeResult(url=url)
