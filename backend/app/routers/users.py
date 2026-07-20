import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.helpers.auth import verify_unsubscribe_token
from app.helpers.publications import build_publications_query
from app.helpers.users import get_user_by_id, update_user_fields
from app.models.user import User
from app.schemas.publication import PaginatedPublications
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user=Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = await update_user_fields(db, current_user, data)
    return UserOut.model_validate(user)


@router.get("/users/unsubscribe-digest", response_class=HTMLResponse)
async def unsubscribe_digest(token: str, db: AsyncSession = Depends(get_db)):
    user_id = verify_unsubscribe_token(token)
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.subscribed_only = False
    await db.commit()
    return HTMLResponse("""
    <html>
      <head><title>Unsubscribed</title></head>
      <body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
                   max-width:480px;margin:80px auto;text-align:center;color:#111827;">
        <h2 style="font-size:20px;margin-bottom:8px;">You've been unsubscribed</h2>
        <p style="color:#6b7280;font-size:14px;">
          You won't receive these emails anymore.
        </p>
      </body>
    </html>
    """)


@router.get("/users/{user_id}/publications", response_model=PaginatedPublications)
async def get_user_publications(
    user_id: uuid.UUID,
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return await build_publications_query(
        db,
        cursor=cursor,
        limit=limit,
        category=None,
        search=None,
        seed=None,
        user_id=current_user.id,
        filter_by_user_id=user_id,
        include_unlisted=(current_user.id == user_id),
    )
