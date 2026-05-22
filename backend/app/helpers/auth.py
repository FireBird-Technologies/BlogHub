import uuid
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.settings import settings

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


async def get_google_user_info(access_token: str) -> dict:
    """Call Google's userinfo endpoint with the access token from the frontend."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google access token",
        )
    return response.json()


async def upsert_user(db: AsyncSession, google_info: dict):
    from app.models.user import User

    result = await db.execute(select(User).where(User.google_id == google_info["id"]))
    user = result.scalar_one_or_none()

    if user:
        # Existing user: keep name/avatar as the user may have edited them.
        pass
    else:
        from app.helpers.users import generate_unique_tag

        name = google_info.get("name", "")
        user = User(
            google_id=google_info["id"],
            email=google_info["email"],
            name=name,
            tag=await generate_unique_tag(db, name),
            avatar_url=google_info.get("picture"),
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)
    return user


def create_jwt(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_jwt(token: str) -> uuid.UUID:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return uuid.UUID(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
