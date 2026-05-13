import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.helpers.comments import create_comment, delete_comment, get_comments
from app.schemas.comment import CommentCreate, CommentOut

router = APIRouter(tags=["comments"])


@router.get("/publications/{publication_id}/comments", response_model=list[CommentOut])
async def list_comments(
    publication_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_optional_user),
):
    return await get_comments(db, publication_id)


@router.post(
    "/publications/{publication_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    publication_id: uuid.UUID,
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await create_comment(db, current_user.id, publication_id, body.content)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_comment(
    comment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = await delete_comment(db, comment_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
