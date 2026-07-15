import random
import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import UserUpdate

# After onboarding, a user gets one free tag change; further changes are
# rate-limited to one per this window.
TAG_CHANGE_COOLDOWN = timedelta(days=14)


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID):
    from app.models.user import User

    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


def _slug_name(name: str) -> str:
    """Reduce a display name to a lowercase alphanumeric tag base."""
    slug = re.sub(r"[^a-z0-9]", "", (name or "").lower())
    return slug[:24] or "user"


async def is_tag_available(
    db: AsyncSession, tag: str, exclude_user_id: uuid.UUID | None = None
) -> bool:
    """True when no other user already owns this tag."""
    from app.models.user import User

    stmt = select(User.id).where(User.tag == tag)
    if exclude_user_id is not None:
        stmt = stmt.where(User.id != exclude_user_id)
    result = await db.execute(stmt)
    return result.first() is None


async def generate_unique_tag(db: AsyncSession, name: str) -> str:
    """Build a tag from the user's name plus a random number, unique in the DB."""
    base = _slug_name(name)
    for _ in range(25):
        candidate = f"{base}{random.randint(1000, 9999)}"
        if await is_tag_available(db, candidate):
            return candidate
    while True:
        candidate = f"{base}{random.randint(100000, 9_999_999)}"
        if await is_tag_available(db, candidate):
            return candidate


async def update_user_fields(db: AsyncSession, user, data: UserUpdate):
    if data.name is not None:
        user.name = data.name
    if data.tag is not None:
        new_tag = data.tag.strip().lower()
        if not new_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Tag is required."
            )
        if new_tag != user.tag:
            if not await is_tag_available(db, new_tag, exclude_user_id=user.id):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="That tag is already taken.",
                )
            # Cooldown applies only after onboarding; onboarding-phase edits
            # are free. user.onboarded is still the pre-request value here.
            if user.onboarded:
                now = datetime.now(timezone.utc)
                if user.tag_changed_at is not None:
                    next_allowed = user.tag_changed_at + TAG_CHANGE_COOLDOWN
                    if now < next_allowed:
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail=(
                                "You can't change your tag till "
                                f"{next_allowed:%B %d, %Y}."
                            ),
                        )
                user.tag_changed_at = now
            user.tag = new_tag
    if data.website is not None:
        user.website = data.website
    fields_set = data.model_fields_set
    if "avatar_url" in fields_set:
        user.avatar_url = data.avatar_url
    if "avatar_position" in fields_set:
        user.avatar_position = data.avatar_position
    if "avatar_scale" in fields_set:
        user.avatar_scale = data.avatar_scale
    if data.onboarded is not None:
        user.onboarded = data.onboarded
    try:
        await db.commit()
    except IntegrityError:
        # Backstop for a race between the availability check and commit.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="That tag is already taken."
        )
    await db.refresh(user)
    return user
