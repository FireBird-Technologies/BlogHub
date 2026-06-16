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


async def _get_top_weekly(db: AsyncSession, user_id: uuid.UUID | None = None) -> list[PublicationOut]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    stmt = (
        select(Publication)
        .options(selectinload(Publication.author))
        .where(Publication.created_at >= cutoff)
        .order_by(Publication.upvote_count.desc(), Publication.created_at.desc())
        .limit(TOP_WEEKLY_LIMIT)
    )
    result = await db.execute(stmt)
    pubs = list(result.scalars().all())

    upvoted_ids, comment_counts = await _batch_meta(db, pubs, user_id)
    verified_map, my_status_map = await _batch_claims(db, pubs, user_id)
    return [
        _pub_to_out(p, upvoted_ids, comment_counts, verified_map=verified_map, my_status_map=my_status_map)
        for p in pubs
    ]


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
        select(User.id, User.email).where(User.subscribed_only.is_(True))
    )
    subscribers = result.all()

    for user_id, email in subscribers:
        token = create_unsubscribe_token(user_id)
        await send_weekly_digest(email, pubs, token)

    return {"sent": len(subscribers), "posts": len(pubs)}
