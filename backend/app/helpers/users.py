import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import UserUpdate


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID):
    from app.models.user import User

    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user_fields(db: AsyncSession, user, data: UserUpdate):
    if data.name is not None:
        user.name = data.name
    if data.bio is not None:
        user.bio = data.bio
    await db.commit()
    await db.refresh(user)
    return user
