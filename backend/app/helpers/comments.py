import uuid

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment
from app.schemas.comment import CommentOut
from app.schemas.user import UserOut


async def get_comments(db: AsyncSession, publication_id: uuid.UUID) -> list[CommentOut]:
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.publication_id == publication_id)
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()
    return [_to_out(c) for c in comments]


async def create_comment(
    db: AsyncSession,
    user_id: uuid.UUID,
    publication_id: uuid.UUID,
    content: str,
    parent_id: uuid.UUID | None = None,
) -> CommentOut:
    if parent_id is not None:
        parent_result = await db.execute(select(Comment).where(Comment.id == parent_id))
        parent = parent_result.scalar_one_or_none()
        if parent is None or parent.publication_id != publication_id:
            raise ValueError("parent comment not found for this publication")

    comment = Comment(
        user_id=user_id,
        publication_id=publication_id,
        content=content,
        parent_id=parent_id,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    result = await db.execute(
        select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment.id)
    )
    return _to_out(result.scalar_one())


async def delete_comment(db: AsyncSession, comment_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.user_id == user_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        return False
    await db.execute(delete(Comment).where(Comment.id == comment_id))
    await db.commit()
    return True


def _to_out(c: Comment) -> CommentOut:
    return CommentOut(
        id=c.id,
        content=c.content,
        created_at=c.created_at,
        parent_id=c.parent_id,
        author=UserOut.model_validate(c.author),
    )
