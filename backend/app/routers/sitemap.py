import re
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.database import get_db
from app.models.publication import CATEGORIES, Publication

router = APIRouter()

FRONTEND_URL = "https://bloghub.app"

STATIC_URLS = [
    {"loc": f"{FRONTEND_URL}/", "changefreq": "weekly", "priority": "1.0"},
    {"loc": f"{FRONTEND_URL}/dashboard", "changefreq": "hourly", "priority": "0.9"},
    {"loc": f"{FRONTEND_URL}/terms", "changefreq": "yearly", "priority": "0.3"},
    {"loc": f"{FRONTEND_URL}/privacy", "changefreq": "yearly", "priority": "0.3"},
]


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return slug[:60].rstrip("-")


def _url_entry(loc: str, lastmod: str | None = None, changefreq: str = "weekly", priority: str = "0.5") -> str:
    parts = ["  <url>", f"    <loc>{loc}</loc>"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
    parts += [f"    <changefreq>{changefreq}</changefreq>", f"    <priority>{priority}</priority>", "  </url>"]
    return "\n".join(parts)


@router.get("/sitemap.xml", include_in_schema=False)
async def sitemap(db: AsyncSession = Depends(get_db)):
    entries: list[str] = []

    for u in STATIC_URLS:
        entries.append(_url_entry(u["loc"], changefreq=u["changefreq"], priority=u["priority"]))

    # Category ranking pages (builtin categories + "Others"). Slugs must match
    # the frontend's categoryPath(): encodeURIComponent(name), "others" for custom.
    for category in [*CATEGORIES, "others"]:
        slug = category if category == "others" else quote(category)
        loc = f"{FRONTEND_URL}/category/{slug}"
        entries.append(_url_entry(loc, changefreq="daily", priority="0.8"))

    result = await db.execute(
        select(Publication.id, Publication.title, Publication.created_at).order_by(
            Publication.created_at.desc()
        )
    )
    for pub_id, title, created_at in result.all():
        short_id = pub_id.hex[:8]
        slug = _slugify(title)
        path = f"{slug}-{short_id}" if slug else short_id
        loc = f"{FRONTEND_URL}/publications/{path}"
        lastmod = created_at.strftime("%Y-%m-%d")
        entries.append(_url_entry(loc, lastmod=lastmod, changefreq="monthly", priority="0.7"))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>"
    )
    return Response(content=xml, media_type="application/xml")
