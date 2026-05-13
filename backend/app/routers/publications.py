import uuid

from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.helpers.publications import (
    build_publications_query,
    get_publication_by_id,
    toggle_upvote,
)
from app.models.publication import Publication
from app.schemas.publication import (
    PaginatedPublications,
    PublicationCreate,
    PublicationOut,
    PublicationUpdate,
    UpvoteResponse,
)

router = APIRouter(tags=["publications"])


@router.get("/publications", response_model=PaginatedPublications)
async def list_publications(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    seed: int | None = Query(default=None),
    sort: str | None = Query(default="ranked"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    return await build_publications_query(
        db,
        cursor=cursor,
        limit=limit,
        category=category,
        search=search,
        seed=seed,
        user_id=user_id,
        sort=sort,
    )


def _normalize_rank_tz(tz: str | None) -> str:
    raw = (tz or "UTC").strip() or "UTC"
    if len(raw) > 120:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid timezone")
    try:
        ZoneInfo(raw)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unknown IANA timezone; use e.g. America/New_York or UTC",
        ) from None
    return raw


@router.get("/publications/{publication_id}", response_model=PublicationOut)
async def get_publication(
    publication_id: uuid.UUID,
    tz: str | None = Query(
        default=None,
        description="IANA timezone used to group posts by calendar day for rank (browser tz recommended)",
    ),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    rank_tz = _normalize_rank_tz(tz if tz is not None else "UTC")
    pub = await get_publication_by_id(db, publication_id, user_id, rank_timezone=rank_tz)
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    return pub


@router.post("/publications", response_model=PublicationOut, status_code=status.HTTP_201_CREATED)
async def create_publication(
    data: PublicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    pub = Publication(
        user_id=current_user.id,
        url=data.url,
        title=data.title,
        description=data.description,
        image_url=data.image_url,
        category=data.category,
        tags=data.tags,
        additional_links=[str(u) for u in data.additional_links],
        social_links=[sl.model_dump(mode="json") for sl in data.social_links],
    )
    db.add(pub)
    await db.commit()

    created = await get_publication_by_id(db, pub.id, current_user.id)
    if not created:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load publication")
    return created


@router.patch("/publications/{publication_id}", response_model=PublicationOut)
async def update_publication(
    publication_id: uuid.UUID,
    data: PublicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from sqlalchemy import select

    result = await db.execute(select(Publication).where(Publication.id == publication_id))
    pub = result.scalar_one_or_none()
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    if pub.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your publication")

    pub.url = data.url.strip()
    pub.title = data.title.strip()
    pub.description = data.description
    pub.image_url = data.image_url
    pub.category = data.category
    pub.tags = data.tags
    pub.additional_links = [str(u) for u in data.additional_links]
    pub.social_links = [sl.model_dump(mode="json") for sl in data.social_links]

    await db.commit()

    updated = await get_publication_by_id(db, publication_id, current_user.id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load publication")
    return updated


@router.delete("/publications/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_publication(
    publication_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from sqlalchemy import select, delete as sa_delete
    result = await db.execute(
        select(Publication).where(Publication.id == publication_id)
    )
    pub = result.scalar_one_or_none()
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    if pub.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your publication")
    await db.execute(sa_delete(Publication).where(Publication.id == publication_id))
    await db.commit()


@router.post("/publications/{publication_id}/upvote", response_model=UpvoteResponse)
async def upvote_publication(
    publication_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from sqlalchemy import select
    result = await db.execute(
        select(Publication).where(Publication.id == publication_id)
    )
    pub = result.scalar_one_or_none()
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    return await toggle_upvote(db, user_id=current_user.id, publication_id=publication_id)
