import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_optional_user
from app.helpers.publications import _batch_claims, _batch_meta, _pub_to_out
from app.helpers.roundups import generate_roundups
from app.models.publication import Publication
from app.models.roundup import FeaturedRoundup
from app.schemas.roundup import RoundupDetail, RoundupSummary
from app.settings import settings

router = APIRouter(tags=["roundups"])


@router.post("/roundups/generate")
async def generate_roundups_endpoint(
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
    db: AsyncSession = Depends(get_db),
):
    """Generate this month's category roundup pages. Triggered by an external cron job."""
    if not settings.CRON_SECRET or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing cron secret")
    return await generate_roundups(db)


@router.get("/roundups", response_model=list[RoundupSummary])
async def list_roundups(db: AsyncSession = Depends(get_db)):
    """All roundups, newest month first, for the blog index."""
    result = await db.execute(
        select(FeaturedRoundup).order_by(
            FeaturedRoundup.week_start.desc(), FeaturedRoundup.created_at.desc()
        )
    )
    roundups = result.scalars().all()
    return [
        RoundupSummary(
            slug=r.slug,
            title=r.title,
            category=r.category,
            week_start=r.week_start,
            count=len(r.publication_ids or []),
            underrated_count=len(r.underrated_ids or []),
            created_at=r.created_at,
        )
        for r in roundups
    ]


@router.get("/roundups/{slug}", response_model=RoundupDetail)
async def get_roundup(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """One roundup with its publications hydrated live, preserving stored order."""
    result = await db.execute(select(FeaturedRoundup).where(FeaturedRoundup.slug == slug))
    roundup = result.scalar_one_or_none()
    if roundup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roundup not found")

    def _parse_ids(raw_ids) -> list[uuid.UUID]:
        out: list[uuid.UUID] = []
        for raw in raw_ids or []:
            try:
                out.append(uuid.UUID(str(raw)))
            except (ValueError, AttributeError):
                continue
        return out

    top_ids = _parse_ids(roundup.publication_ids)
    underrated_ids = _parse_ids(roundup.underrated_ids)

    # One fetch for both lists (a publication can in principle appear in either).
    all_ids = list({*top_ids, *underrated_ids})
    pubs_by_id: dict[uuid.UUID, Publication] = {}
    if all_ids:
        pub_result = await db.execute(
            select(Publication)
            .options(selectinload(Publication.author))
            .where(Publication.id.in_(all_ids))
        )
        pubs_by_id = {p.id: p for p in pub_result.scalars().all()}

    # Keep stored order; silently drop any publication deleted since generation.
    top_pubs = [pubs_by_id[pid] for pid in top_ids if pid in pubs_by_id]
    underrated_pubs = [pubs_by_id[pid] for pid in underrated_ids if pid in pubs_by_id]

    user_id = current_user.id if current_user else None
    # Batch the metadata over the union so each row is queried once.
    all_pubs = list(pubs_by_id.values())
    upvoted_ids, comment_counts = await _batch_meta(db, all_pubs, user_id)
    verified_map, my_status_map = await _batch_claims(db, all_pubs, user_id)

    def _to_out(pubs):
        return [
            _pub_to_out(p, upvoted_ids, comment_counts, verified_map=verified_map, my_status_map=my_status_map)
            for p in pubs
        ]

    publications = _to_out(top_pubs)
    underrated = _to_out(underrated_pubs)

    return RoundupDetail(
        slug=roundup.slug,
        title=roundup.title,
        category=roundup.category,
        week_start=roundup.week_start,
        count=len(publications),
        created_at=roundup.created_at,
        publications=publications,
        underrated=underrated,
    )
