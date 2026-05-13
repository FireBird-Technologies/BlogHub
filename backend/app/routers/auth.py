from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.helpers.auth import create_jwt, get_google_user_info, upsert_user

router = APIRouter(tags=["auth"])


class GoogleTokenRequest(BaseModel):
    access_token: str


class TokenResponse(BaseModel):
    token: str


@router.post("/auth/google/token", response_model=TokenResponse)
async def google_token_login(
    body: GoogleTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive the Google access token from the frontend (implicit flow),
    call Google's userinfo API to identify the user, upsert them in the DB,
    and return our own JWT. No client secret required.
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
