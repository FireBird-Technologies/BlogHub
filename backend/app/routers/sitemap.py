from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.database import get_db
from app.models.publication import Publication

router = APIRouter()

FRONTEND_URL = "https://bloghub.app"

STATIC_URLS = [
    {"loc": f"{FRONTEND_URL}/", "changefreq": "weekly", "priority": "1.0"},
    {"loc": f"{FRONTEND_URL}/dashboard", "changefreq": "hourly", "priority": "0.9"},
]


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

    result = await db.execute(
        select(Publication.id, Publication.created_at).order_by(Publication.created_at.desc())
    )
    for pub_id, created_at in result.all():
        loc = f"{FRONTEND_URL}/publications/{pub_id}"
        lastmod = created_at.strftime("%Y-%m-%d")
        entries.append(_url_entry(loc, lastmod=lastmod, changefreq="monthly", priority="0.7"))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>"
    )
    return Response(content=xml, media_type="application/xml")
