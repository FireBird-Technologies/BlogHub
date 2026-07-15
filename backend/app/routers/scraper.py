from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Query, status

from app.helpers.llm_description import enrich_scraped_description
from app.helpers.scraper import scrape_with_firecrawl
from app.settings import settings
from app.schemas.scraper import ScrapeResult

router = APIRouter(tags=["scraper"])


@router.get("/scrape", response_model=ScrapeResult)
async def scrape_url(
    url: str = Query(..., description="URL to scrape"),
    mode: str = Query(
        "publication",
        pattern="^(publication|link)$",
        description="'publication' collapses to the base site; 'link' keeps the full path",
    ),
):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="URL must start with http:// or https://",
        )

    result = await scrape_with_firecrawl(url, mode=mode)

    if settings.OPEN_ROUTER_KEY:
        # Use the canonical URL Firecrawl actually fetched, so the LLM summary
        # describes the same page rather than the original (unshortened) article.
        enriched = await enrich_scraped_description(
            url=result.url,
            title=result.title,
            description=result.description,
        )
        if enriched:
            result = result.model_copy(update={"description": enriched})

    return result
