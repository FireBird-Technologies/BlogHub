from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.helpers.auth import (
    create_jwt,
    get_google_user_from_id_token,
    get_google_user_info,
    upsert_user,
)

router = APIRouter(tags=["auth"])


class GoogleTokenRequest(BaseModel):
    access_token: str


class GoogleIdTokenRequest(BaseModel):
    id_token: str


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
