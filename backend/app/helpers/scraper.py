from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.schemas.scraper import ScrapeResult


async def fetch_url(url: str) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; BlogHubBot/1.0; +https://bloghub.app)"
        )
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.text


def make_absolute(src: str, base: str) -> str:
    if not src:
        return src
    return urljoin(base, src)


def parse_og_tags(html: str, base_url: str) -> ScrapeResult:
    soup = BeautifulSoup(html, "html.parser")

    def meta(prop: str, attr: str = "property") -> str | None:
        tag = soup.find("meta", attrs={attr: prop})
        if tag and tag.get("content"):
            return tag["content"].strip() or None
        return None

    title = (
        meta("og:title")
        or meta("twitter:title")
        or (soup.title.string.strip() if soup.title and soup.title.string else None)
    )

    description = (
        meta("og:description")
        or meta("twitter:description")
        or meta("description", attr="name")
    )

    image = meta("og:image") or meta("twitter:image")

    if not image:
        img_tag = soup.find("img", src=True)
        if img_tag:
            image = img_tag["src"]

    if image:
        image = make_absolute(image, base_url)

    parsed = urlparse(base_url)
    canonical_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

    return ScrapeResult(
        url=canonical_url,
        title=title,
        description=description,
        image_url=image,
    )
