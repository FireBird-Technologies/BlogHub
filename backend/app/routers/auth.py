from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.helpers.auth import (
    create_jwt,
    get_google_user_from_id_token,
    get_google_user_info,
    reactivate_user,
    upsert_user,
)

router = APIRouter(tags=["auth"])


class GoogleTokenRequest(BaseModel):
    access_token: str


class GoogleIdTokenRequest(BaseModel):
    id_token: str


class ReactivateRequest(BaseModel):
    """Accepts whichever credential the client used to sign in. Exactly one is required."""

    id_token: str | None = None
    access_token: str | None = None


class TokenResponse(BaseModel):
    token: str


@router.post("/auth/google/token", response_model=TokenResponse)
async def google_token_login(
    body: GoogleTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Legacy implicit-flow login: takes a Google access token, hits userinfo,
    upserts the user, returns our JWT. Kept for backwards compatibility with
    older frontend builds; new clients should use /auth/google/id-token.
    """
    try:
        google_user = await get_google_user_info(body.access_token)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not verify Google token: {exc}",
        )

    user = await upsert_user(db, google_user)
    return TokenResponse(token=create_jwt(str(user.id)))


@router.post("/auth/reactivate", response_model=TokenResponse)
async def reactivate_account(
    body: ReactivateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Turn a self-deleted account back on and issue a session. Re-verifies the
    Google credential because the user has no valid JWT while deactivated.
    """
    if not body.id_token and not body.access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A Google credential is required to reactivate.",
        )

    try:
        if body.id_token:
            google_user = await get_google_user_from_id_token(body.id_token)
        else:
            google_user = await get_google_user_info(body.access_token)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not verify Google token: {exc}",
        )

    user = await reactivate_user(db, google_user)
    return TokenResponse(token=create_jwt(str(user.id)))


@router.post("/auth/google/id-token", response_model=TokenResponse)
async def google_id_token_login(
    body: GoogleIdTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    GIS / FedCM login: takes the JWT credential issued by Google Identity
    Services, verifies it against Google's tokeninfo endpoint, upserts the
    user, returns our JWT. No popup required, works reliably on mobile.
    """
    try:
        google_user = await get_google_user_from_id_token(body.id_token)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not verify Google ID token: {exc}",
        )

    user = await upsert_user(db, google_user)
    return TokenResponse(token=create_jwt(str(user.id)))
