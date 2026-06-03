import uuid

from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.helpers.publications import (
    build_publications_query,
    get_publication_by_id,
    resolve_publication_short_id,
    toggle_upvote,
)
from app.models.publication import Publication
from app.models.publication_claim import PublicationClaim
from app.schemas.claim import ClaimCreate, ClaimOut
from app.schemas.publication import (
    PaginatedPublications,
    PublicationCreate,
    PublicationOut,
    PublicationUpdate,
    UpvoteResponse,
)
from app.helpers.email import send_claim_notification

router = APIRouter(tags=["publications"])


@router.get("/publications/categories", response_model=list[str])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Publication.category).distinct().order_by(Publication.category)
    )
    return result.scalars().all()


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
    publication_id: str,
    tz: str | None = Query(
        default=None,
        description="IANA timezone used to group posts by calendar day for rank (browser tz recommended)",
    ),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """
    Looks up a publication by either its 8-char hex short id (used in the
    public /publications/<slug>-<shortid> URL) or its full UUID (used by
    internal callers that already have the full id).
    """
    raw = publication_id.strip().lower()
    pub_uuid: uuid.UUID | None = None
    if len(raw) == 8:
        pub_uuid = await resolve_publication_short_id(db, raw)
    else:
        try:
            pub_uuid = uuid.UUID(raw)
        except ValueError:
            pub_uuid = None

    if pub_uuid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    user_id = current_user.id if current_user else None
    rank_tz = _normalize_rank_tz(tz if tz is not None else "UTC")
    pub = await get_publication_by_id(db, pub_uuid, user_id, rank_timezone=rank_tz)
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


@router.post(
    "/publications/{publication_id}/claim",
    response_model=ClaimOut,
    status_code=status.HTTP_201_CREATED,
)
async def claim_publication(
    publication_id: uuid.UUID,
    data: ClaimCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Publication).where(Publication.id == publication_id))
    pub = result.scalar_one_or_none()
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    # Once a publication is verified (by anyone), claiming is closed.
    verified_exists = await db.execute(
        select(PublicationClaim.id).where(
            PublicationClaim.publication_id == publication_id,
            PublicationClaim.status == "verified",
        )
    )
    if verified_exists.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="This publication is already verified"
        )

    social_links = [sl.model_dump(mode="json") for sl in data.social_links]
    original_url = str(data.original_url) if data.original_url else None

    existing_result = await db.execute(
        select(PublicationClaim).where(
            PublicationClaim.publication_id == publication_id,
            PublicationClaim.user_id == current_user.id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing and existing.status in ("pending", "verified"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="You already submitted a claim"
        )

    if existing:  # previously rejected — allow re-claim
        existing.claimer_name = data.name
        existing.claimer_email = current_user.email
        existing.social_links = social_links
        existing.original_url = original_url
        existing.comment = data.comment
        existing.status = "pending"
        existing.verified_at = None
        claim = existing
    else:
        claim = PublicationClaim(
            publication_id=publication_id,
            user_id=current_user.id,
            claimer_name=data.name,
            claimer_email=current_user.email,
            social_links=social_links,
            original_url=original_url,
            comment=data.comment,
            status="pending",
        )
        db.add(claim)

    await db.commit()
    await db.refresh(claim)

    # Best-effort owner notification; must not fail the request.
    try:
        await send_claim_notification(
            claim_id=claim.id,
            publication=pub,
            claimer_name=data.name,
            claimer_email=current_user.email,
            social_links=social_links,
            original_url=original_url,
            comment=data.comment,
        )
    except Exception:  # noqa: BLE001
        pass

    return claim
