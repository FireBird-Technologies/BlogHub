from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.helpers.auth import decode_jwt


async def get_current_user(
    authorization: str = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = authorization.removeprefix("Bearer ").strip()
    user_id = decode_jwt(token)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


async def get_optional_user(
    authorization: str = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User

    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        token = authorization.removeprefix("Bearer ").strip()
        user_id = decode_jwt(token)
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except Exception:
        return None
