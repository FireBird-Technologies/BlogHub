import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_optional_user
from app.helpers.auth import create_unsubscribe_token
from app.helpers.email import send_weekly_digest
from app.helpers.publications import _batch_claims, _batch_meta, _pub_to_out
from app.models.publication import Publication
from app.models.user import User
from app.schemas.publication import PublicationOut
from app.settings import settings

router = APIRouter(tags=["trending"])

TOP_WEEKLY_LIMIT = 5


async def _get_weekly(
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
    *,
    ascending: bool = False,
    exclude_ids: set[uuid.UUID] | None = None,
) -> list[PublicationOut]:
    """Top or underrated 5 publications from the past 7 days, ranked by upvote count.

    `ascending=False` (default) gives the highest-upvoted "top" picks;
    `ascending=True` gives the lowest-upvoted "underrated" picks. `exclude_ids`
    drops specific publications (used so the underrated digest never repeats a post
    already in that week's top digest).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    upvote_order = (
        Publication.upvote_count.asc() if ascending else Publication.upvote_count.desc()
    )

    stmt = (
        select(Publication)
        .options(selectinload(Publication.author))
        .where(Publication.created_at >= cutoff)
        .order_by(upvote_order, Publication.created_at.desc())
        .limit(TOP_WEEKLY_LIMIT)
    )
    if exclude_ids:
        stmt = stmt.where(Publication.id.notin_(exclude_ids))
    result = await db.execute(stmt)
    pubs = list(result.scalars().all())

    upvoted_ids, comment_counts = await _batch_meta(db, pubs, user_id)
    verified_map, my_status_map = await _batch_claims(db, pubs, user_id)
    return [
        _pub_to_out(p, upvoted_ids, comment_counts, verified_map=verified_map, my_status_map=my_status_map)
        for p in pubs
    ]


async def _get_top_weekly(db: AsyncSession, user_id: uuid.UUID | None = None) -> list[PublicationOut]:
    return await _get_weekly(db, user_id, ascending=False)


async def _get_underrated_weekly(
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
    *,
    exclude_ids: set[uuid.UUID] | None = None,
) -> list[PublicationOut]:
    return await _get_weekly(db, user_id, ascending=True, exclude_ids=exclude_ids)


@router.get("/publications/top-weekly", response_model=list[PublicationOut])
async def top_weekly_publications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """Top 5 publications from the past 7 days, ranked by upvote count (highest first)."""
    user_id = current_user.id if current_user else None
    return await _get_top_weekly(db, user_id)


@router.post("/publications/top-weekly/send-digest")
async def send_weekly_digest_endpoint(
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
    db: AsyncSession = Depends(get_db),
):
    """Email the top-5 weekly publications to all users. Triggered by an external cron job."""
    if not settings.CRON_SECRET or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing cron secret")

    pubs = await _get_top_weekly(db)
    if not pubs:
        return {"sent": 0, "posts": 0}

    result = await db.execute(
        select(User.id, User.email, User.name).where(User.subscribed_only.is_(True))
    )
    subscribers = result.all()

    for user_id, email, name in subscribers:
        token = create_unsubscribe_token(user_id)
        await send_weekly_digest(email, pubs, token, name, utm_content="top_weekly")

    return {"sent": len(subscribers), "posts": len(pubs)}


@router.get("/publications/underrated-weekly", response_model=list[PublicationOut])
async def underrated_weekly_publications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """Bottom 5 publications from the past 7 days, ranked by upvote count (lowest first).

    Excludes that week's top-5 so the two lists never overlap (matches the digest).
    """
    user_id = current_user.id if current_user else None
    top = await _get_top_weekly(db, user_id)
    return await _get_underrated_weekly(db, user_id, exclude_ids={p.id for p in top})


@router.post("/publications/underrated-weekly/send-digest")
async def send_underrated_digest_endpoint(
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
    db: AsyncSession = Depends(get_db),
):
    """Email the 5 lowest-upvoted weekly publications to all users. Triggered by an external cron job.

    Excludes that week's top-5 so a post never appears in both digests.
    """
    if not settings.CRON_SECRET or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing cron secret")

    top = await _get_top_weekly(db)
    pubs = await _get_underrated_weekly(db, exclude_ids={p.id for p in top})
    if not pubs:
        return {"sent": 0, "posts": 0}

    result = await db.execute(
        select(User.id, User.email, User.name).where(User.subscribed_only.is_(True))
    )
    subscribers = result.all()

    for user_id, email, name in subscribers:
        token = create_unsubscribe_token(user_id)
        await send_weekly_digest(
            email,
            pubs,
            token,
            name,
            subject="5 hidden gems this week",
            intro="Here are some great posts that deserve more eyes:",
            utm_content="underrated_weekly",
        )

    return {"sent": len(subscribers), "posts": len(pubs)}


