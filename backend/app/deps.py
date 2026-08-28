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

    # 403 rather than 401 on purpose: the frontend's axios interceptor force-logs-out
    # on 401, which would clear the token before the reason can be shown to the user.
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "account_blocked", "message": "Your account has been blocked."},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "account_inactive", "message": "Your account is inactive."},
        )

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
        user = result.scalar_one_or_none()
        # Treat a blocked or deleted account as anonymous rather than raising, so
        # this stays a "best effort" dependency for public endpoints.
        if user and (user.is_blocked or not user.is_active):
            return None
        return user
    except Exception:
        return None
