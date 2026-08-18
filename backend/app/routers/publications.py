import uuid
from datetime import date, datetime, time, timezone

from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.helpers.publications import (
    build_publications_query,
    get_publication_by_id,
    list_distinct_tags,
    resolve_publication_short_id,
    toggle_upvote,
)
from app.helpers.url_normalize import normalize_link_url, normalize_publication_url
from app.models.publication import Publication
from app.models.publication_claim import PublicationClaim
from app.models.publication_invite import PublicationInvite
from app.schemas.claim import ApproveClaimRequest, ClaimCreate, ClaimOut, ResubmitAndClaimCreate
from app.schemas.publication import (
    PaginatedPublications,
    PublicationCreate,
    PublicationFromLinkCreate,
    PublicationInviteIn,
    PublicationInviteOut,
    PublicationOut,
    PublicationUpdate,
    ResubmitRequiredResponse,
    UpvoteResponse,
)
from app.helpers.email import (
    send_claim_approved_notification,
    send_claim_notification,
    send_publication_invite,
)
from app.settings import settings

router = APIRouter(tags=["publications"])


async def _publication_has_verified_claim(db: AsyncSession, publication_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(PublicationClaim.id).where(
            PublicationClaim.publication_id == publication_id,
            PublicationClaim.status == "verified",
        ).limit(1)
    )
    return result.first() is not None


@router.get("/publications/categories", response_model=list[str])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Publication.category).distinct().order_by(Publication.category)
    )
    return result.scalars().all()


@router.get("/publications/tags", response_model=list[str])
async def list_tags(db: AsyncSession = Depends(get_db)):
    return await list_distinct_tags(db)


@router.get("/publications", response_model=PaginatedPublications)
async def list_publications(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    tz: str | None = Query(
        default=None,
        description="IANA timezone the date_from/date_to calendar dates are expressed in "
        "(browser tz recommended). Defaults to UTC.",
    ),
    seed: int | None = Query(default=None),
    sort: str | None = Query(default="ranked"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    # Build the date window in the viewer's timezone so "today" (etc.) matches the
    # calendar day the user sees, then let the DB compare against UTC-stored
    # created_at. Without this, a bare date treated as UTC drops publications near
    # the local-day boundary.
    filter_tz = ZoneInfo(_normalize_rank_tz(tz)) if (date_from or date_to) else timezone.utc
    created_from = (
        datetime.combine(date_from, time.min, tzinfo=filter_tz) if date_from else None
    )
    created_to = (
        datetime.combine(date_to, time.max, tzinfo=filter_tz) if date_to else None
    )
    return await build_publications_query(
        db,
        cursor=cursor,
        limit=limit,
        category=category,
        search=search,
        tag=tag,
        date_from=created_from,
        date_to=created_to,
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


@router.post("/publications", response_model=PublicationOut | ResubmitRequiredResponse)
async def create_publication(
    data: PublicationCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    canonical_url = normalize_publication_url(data.url)
    if not canonical_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid publication URL")

    # Guard against a cross-type duplicate: an unlisted (feature-only) listing keeps
    # the full path, so it can point at the exact same URL this submission does even
    # though this endpoint collapses to the base site. Block that so the same page
    # isn't backed by two rows.
    full_url = normalize_link_url(data.url)
    if full_url and full_url != canonical_url:
        dupe = await db.execute(
            select(Publication).where(Publication.url == full_url, Publication.is_unlisted.is_(True))
        )
        if dupe.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This link already exists as a featured-only listing.",
            )

    result = await db.execute(select(Publication).where(Publication.url == canonical_url))
    existing = result.scalar_one_or_none()

    if existing:
        if await _publication_has_verified_claim(db, existing.id):
            # Owner re-adding their own verified pub: overwrite content, keep it
            # verified, and resurface to today. Non-owners are still blocked.
            if existing.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This publication is verified and cannot be updated or resubmitted",
                )
            existing.title = data.title.strip()
            existing.description = data.description
            existing.image_url = data.image_url
            existing.image_position = data.image_position
            existing.image_scale = data.image_scale
            existing.category = data.category
            existing.tags = [t.strip().lower() for t in data.tags if t.strip()]
            existing.additional_links = [str(u) for u in data.additional_links]
            existing.social_links = [sl.model_dump(mode="json") for sl in data.social_links]
            existing.created_at = datetime.now(timezone.utc)
            # Restart the four-week refresh clock: the listing is current again, so
            # the next "time to refresh" nudge is due four weeks from now, not never.
            existing.resubmit_reminder_sent_at = None
            await db.commit()
            response.status_code = status.HTTP_200_OK
            updated = await get_publication_by_id(db, existing.id, current_user.id)
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to load publication",
                )
            return updated
        # Unverified duplicate: do not update or transfer ownership.
        # Signal the frontend to show the claim form instead.
        response.status_code = status.HTTP_200_OK
        return ResubmitRequiredResponse(publication_id=existing.id)

    pub = Publication(
        user_id=current_user.id,
        url=canonical_url,
        title=data.title.strip(),
        description=data.description,
        image_url=data.image_url,
        image_position=data.image_position,
        image_scale=data.image_scale,
        category=data.category,
        tags=[t.strip().lower() for t in data.tags if t.strip()],
        additional_links=[str(u) for u in data.additional_links],
        social_links=[sl.model_dump(mode="json") for sl in data.social_links],
    )
    db.add(pub)
    await db.commit()
    response.status_code = status.HTTP_201_CREATED
    pub_id = pub.id

    created = await get_publication_by_id(db, pub_id, current_user.id)
    if not created:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load publication")
    return created


@router.post("/publications/from-link", response_model=PublicationOut, status_code=status.HTTP_201_CREATED)
async def create_publication_from_link(
    data: PublicationFromLinkCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create (or reuse) an unlisted publication to back a featured slot, from any
    URL the buyer wants to advertise — not a normal submission, so no claim/verified
    conflict handling: an unlisted row was never publicly listed for anyone to claim.
    """
    # data.url is already the full-path canonical (normalize_link_url, via the schema).
    # Guard against a cross-type duplicate: if the same exact URL already exists as a
    # normal (listed) publication, don't also create a feature-only row for it.
    base_url = normalize_publication_url(data.url)
    if base_url and base_url != data.url:
        listed_dupe = await db.execute(
            select(Publication).where(Publication.url == base_url, Publication.is_unlisted.is_(False))
        )
        if listed_dupe.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This link already exists as a publication.",
            )

    result = await db.execute(select(Publication).where(Publication.url == data.url))
    existing = result.scalar_one_or_none()

    if existing:
        if existing.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This link is already on BlogHub under another account.",
            )
        existing.title = data.title.strip()
        existing.description = data.description
        existing.image_url = data.image_url
        existing.image_position = data.image_position
        existing.image_scale = data.image_scale
        existing.category = data.category
        existing.tags = [t.strip().lower() for t in data.tags if t.strip()]
        await db.commit()
        response.status_code = status.HTTP_200_OK
        pub_id = existing.id
    else:
        pub = Publication(
            user_id=current_user.id,
            url=data.url,
            title=data.title.strip(),
            description=data.description,
            image_url=data.image_url,
            image_position=data.image_position,
            image_scale=data.image_scale,
            category=data.category,
            tags=[t.strip().lower() for t in data.tags if t.strip()],
            is_unlisted=True,
        )
        db.add(pub)
        await db.commit()
        pub_id = pub.id

    created = await get_publication_by_id(db, pub_id, current_user.id)
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

    # Unlisted publications are link-only (a specific page), so keep the full path;
    # normal publications collapse to their base site. Mirrors the scrape flow.
    normalize_url = normalize_link_url if pub.is_unlisted else normalize_publication_url
    canonical_url = normalize_url(data.url)
    if not canonical_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid publication URL")
    if canonical_url != pub.url:
        conflict = await db.execute(
            select(Publication.id).where(
                Publication.url == canonical_url,
                Publication.id != publication_id,
            )
        )
        if conflict.first() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another publication already uses this site URL",
            )
    pub.url = canonical_url
    pub.title = data.title.strip()
    pub.description = data.description
    pub.image_url = data.image_url
    pub.image_position = data.image_position
    pub.image_scale = data.image_scale
    pub.category = data.category
    pub.tags = [t.strip().lower() for t in data.tags if t.strip()]
    pub.additional_links = [str(u) for u in data.additional_links]
    pub.social_links = [sl.model_dump(mode="json") for sl in data.social_links]
    # An owner edit resurfaces the publication to today's ranking.
    pub.created_at = datetime.now(timezone.utc)
    # Restart the four-week refresh clock with it: an edit is a refresh, so the next
    # "time to refresh" nudge is due four weeks from now rather than never again.
    pub.resubmit_reminder_sent_at = None

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


@router.post("/publications/{publication_id}/invite", response_model=PublicationInviteOut)
async def invite_to_publication(
    publication_id: uuid.UUID,
    payload: PublicationInviteIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Email people a link to a publication, inviting them to read and join BlogHub.

    Anyone signed in may invite anyone to any publication — sharing is not restricted
    to the author. Every attempt is recorded in `publication_invites`, successful or
    not, so both sides of the send are auditable.

    Reports per-address outcomes rather than failing the whole request: one bad
    address must not discard the invites that did go out.
    """
    pub = await db.get(Publication, publication_id)
    if pub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    sent: list[str] = []
    failed: list[str] = []

    for address in payload.emails:
        ok = await send_publication_invite(
            to_email=address,
            sender_name=current_user.name,
            publication=pub,
        )
        db.add(
            PublicationInvite(
                publication_id=pub.id,
                sender_id=current_user.id,
                sender_email=current_user.email,
                recipient_email=address,
                status="sent" if ok else "failed",
            )
        )
        (sent if ok else failed).append(address)

    await db.commit()
    return PublicationInviteOut(sent=sent, failed=failed)


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
            status_code=status.HTTP_409_CONFLICT, detail="You already submitted a claim for this publication."
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
    approve_url = (
        f"{settings.FRONTEND_URL}/admin/approve-claim"
        f"?pub_id={publication_id}&claim_id={claim.id}"
    )
    try:
        await send_claim_notification(
            claim_id=claim.id,
            publication=pub,
            claimer_name=data.name,
            claimer_email=current_user.email,
            social_links=social_links,
            original_url=original_url,
            comment=data.comment,
            approve_url=approve_url,
        )
    except Exception:  # noqa: BLE001
        pass

    return claim


class ResubmitAndClaimOut(PublicationOut):
    claim: ClaimOut


@router.post(
    "/publications/{publication_id}/resubmit-and-claim",
    response_model=ResubmitAndClaimOut,
    status_code=status.HTTP_200_OK,
)
async def resubmit_and_claim(
    publication_id: uuid.UUID,
    data: ResubmitAndClaimCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Publication).where(Publication.id == publication_id))
    pub = result.scalar_one_or_none()
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    if await _publication_has_verified_claim(db, publication_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This publication is verified and cannot be updated or resubmitted",
        )

    # Update publication content but do NOT transfer ownership
    pub.url = normalize_publication_url(data.url) or pub.url
    pub.title = data.title.strip()
    pub.description = data.description
    pub.image_url = data.image_url
    pub.image_position = data.image_position
    pub.image_scale = data.image_scale
    pub.category = data.category
    pub.tags = [t.strip().lower() for t in data.tags if t.strip()]
    pub.additional_links = [str(u) for u in data.additional_links]
    pub.social_links = [sl.model_dump(mode="json") for sl in data.social_links]
    # Resubmitting refreshes the publish date so the post resurfaces in rankings,
    # mirroring what claim verification does.
    pub.created_at = datetime.now(timezone.utc)
    # Restart the four-week refresh clock alongside it, so the next "time to refresh"
    # nudge is due four weeks from now rather than never firing again.
    pub.resubmit_reminder_sent_at = None

    # Create or re-open a claim for this user
    claim_social_links = [sl.model_dump(mode="json") for sl in data.claim_social_links]
    original_url = str(data.original_url) if data.original_url else None

    existing_claim_result = await db.execute(
        select(PublicationClaim).where(
            PublicationClaim.publication_id == publication_id,
            PublicationClaim.user_id == current_user.id,
        )
    )
    existing_claim = existing_claim_result.scalar_one_or_none()

    if existing_claim and existing_claim.status in ("pending", "verified"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="You already submitted a claim for this publication."
        )

    if existing_claim:  # previously rejected — allow re-claim
        existing_claim.claimer_name = data.name
        existing_claim.claimer_email = current_user.email
        existing_claim.social_links = claim_social_links
        existing_claim.original_url = original_url
        existing_claim.comment = data.comment
        existing_claim.status = "pending"
        existing_claim.verified_at = None
        claim = existing_claim
    else:
        claim = PublicationClaim(
            publication_id=publication_id,
            user_id=current_user.id,
            claimer_name=data.name,
            claimer_email=current_user.email,
            social_links=claim_social_links,
            original_url=original_url,
            comment=data.comment,
            status="pending",
        )
        db.add(claim)

    await db.commit()
    await db.refresh(claim)

    approve_url = (
        f"{settings.FRONTEND_URL}/admin/approve-claim"
        f"?pub_id={publication_id}&claim_id={claim.id}"
    )
    try:
        await send_claim_notification(
            claim_id=claim.id,
            publication=pub,
            claimer_name=data.name,
            claimer_email=current_user.email,
            social_links=claim_social_links,
            original_url=original_url,
            comment=data.comment,
            approve_url=approve_url,
        )
    except Exception:  # noqa: BLE001
        pass

    updated_pub = await get_publication_by_id(db, publication_id, current_user.id)
    if not updated_pub:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load publication")

    return ResubmitAndClaimOut(**updated_pub.model_dump(), claim=ClaimOut.model_validate(claim))


@router.post(
    "/publications/{publication_id}/approve-claim",
    status_code=status.HTTP_200_OK,
)
async def approve_claim(
    publication_id: uuid.UUID,
    data: ApproveClaimRequest,
    db: AsyncSession = Depends(get_db),
):
    if not settings.CLAIM_APPROVE_PASSWORD or data.password != settings.CLAIM_APPROVE_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    result = await db.execute(select(Publication).where(Publication.id == publication_id))
    pub = result.scalar_one_or_none()
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    claim_result = await db.execute(
        select(PublicationClaim).where(
            PublicationClaim.id == data.claim_id,
            PublicationClaim.publication_id == publication_id,
        )
    )
    claim = claim_result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    if claim.status == "verified":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Claim is already verified")
    if claim.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Claim is not in pending state")

    now = datetime.now(timezone.utc)
    claim.status = "verified"
    claim.verified_at = now
    pub.user_id = claim.user_id
    pub.created_at = now

    await db.commit()

    try:
        await send_claim_approved_notification(
            to_email=claim.claimer_email,
            publication=pub,
            claimer_name=claim.claimer_name,
        )
    except Exception:  # noqa: BLE001
        pass

    return {"ok": True, "publication_id": str(publication_id), "new_owner_id": str(claim.user_id)}
