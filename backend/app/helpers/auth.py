import uuid
import logging
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.settings import settings

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}
logger = logging.getLogger(__name__)


async def get_google_user_info(access_token: str) -> dict:
    """Call Google's userinfo endpoint with the access token from the frontend."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=20.0,
        )
    if response.status_code != 200:
        logger.warning("Google userinfo verification failed with status %s", response.status_code)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google access token",
        )
    return response.json()


async def get_google_user_from_id_token(id_token: str) -> dict:
    """Verify a Google ID token via the tokeninfo endpoint and return user info.

    Returns the same shape as `get_google_user_info` (id/email/name/picture) so
    the rest of the auth flow can stay identical.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_TOKENINFO_URL,
            params={"id_token": id_token},
            timeout=20.0,
        )
    if response.status_code != 200:
        logger.warning("Google ID token verification failed with status %s", response.status_code)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token",
        )
    claims = response.json()

    if claims.get("iss") not in GOOGLE_ISSUERS:
        logger.warning("Google ID token has unexpected issuer: %s", claims.get("iss"))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google ID token has unexpected issuer",
        )
    if claims.get("aud") != settings.GOOGLE_CLIENT_ID:
        logger.warning("Google ID token audience mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google ID token was issued for a different client",
        )
    if "sub" not in claims or "email" not in claims:
        logger.warning("Google ID token missing required claims")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google ID token missing required claims",
        )

    return {
        "id": claims["sub"],
        "email": claims["email"],
        "name": claims.get("name", ""),
        "picture": claims.get("picture"),
    }


def _assert_account_usable(user) -> None:
    """Block sign-in for accounts that are blocked or self-deleted.

    Raises 403 (not 401) with a machine-readable `code` so the frontend can show
    the right screen — a blocked notice, or the reactivation prompt.
    """
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "account_blocked",
                # Shown verbatim under the sign-in button, so it has to stand alone.
                "message": "Your account has been blocked. Please contact us if you think this is a mistake.",
            },
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "account_inactive",
                "message": "Your account is inactive. Reactivate it to sign in again.",
                "email": user.email,
            },
        )


async def upsert_user(db: AsyncSession, google_info: dict):
    from app.models.user import User

    result = await db.execute(select(User).where(User.google_id == google_info["id"]))
    user = result.scalar_one_or_none()

    if user:
        # Never silently revive a deleted account — reactivation is an explicit,
        # separate step the user has to confirm.
        _assert_account_usable(user)
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


async def reactivate_user(db: AsyncSession, google_info: dict):
    """Turn a self-deleted account back on, as a fresh profile.

    Verified against Google rather than a bearer token, because a deactivated user
    has no valid session at this point.
    """
    from app.models.user import User

    result = await db.execute(select(User).where(User.google_id == google_info["id"]))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this Google account.",
        )
    if user.is_blocked:
        # Blocked always wins: a blocked user must not reactivate their way back in.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "account_blocked",
                "message": "Your account has been blocked.",
            },
        )

    if user.is_active:
        # Already active (e.g. a double-submitted reactivation) — just hand back a session.
        return user

    user.is_active = True
    user.deactivated_at = None
    user.subscribed_only = True
    # Start over from the Google profile: the account was emptied on delete.
    user.name = google_info.get("name") or user.name
    user.avatar_url = google_info.get("picture")
    user.avatar_position = None
    user.avatar_scale = None
    user.website = None

    await db.commit()
    await db.refresh(user)
    return user


def create_unsubscribe_token(user_id) -> str:
    payload = {"sub": str(user_id), "purpose": "unsubscribe"}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_unsubscribe_token(token: str) -> uuid.UUID:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("purpose") != "unsubscribe":
            raise ValueError
        return uuid.UUID(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid unsubscribe link")


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
