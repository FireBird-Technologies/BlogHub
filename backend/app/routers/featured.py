from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, get_optional_user
import uuid

from app.helpers.featured import (
    approve_slot,
    create_checkout,
    get_active_feature,
    get_availability,
    get_my_bookings,
    get_slot_for_review,
    record_click,
    record_impression,
    reconcile_slots,
    slot_end_date,
)
from app.helpers.featured_email import (
    approve_draft_as_author,
    build_draft,
    get_author_drafts,
    get_email_for_slot,
    suggested_send_at,
    update_draft,
)
from app.models.publication import Publication
from app.helpers.email import send_support_request
from app.schemas.featured import (
    ActiveFeatureOut,
    AdminPasswordIn,
    ApproveSlotOut,
    ApproveSlotRequest,
    ComposeEmailIn,
    ComposeEmailOut,
    SlotReviewOut,
    FeatureCheckoutIn,
    FeatureCheckoutOut,
    FeaturedAvailabilityOut,
    FeaturedEmailOut,
    FeaturedEmailUpdateIn,
    FeaturedImpressionIn,
    MyBookingOut,
    ReconcileOut,
    SupportRequestIn,
)
from app.settings import settings

router = APIRouter(tags=["featured"])


@router.get("/featured/active", response_model=ActiveFeatureOut | None)
async def active_feature(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """The publication currently featured, or `null` when nothing is booked for today."""
    return await get_active_feature(db, current_user.id if current_user else None)


@router.get("/featured/availability", response_model=FeaturedAvailabilityOut)
async def featured_availability(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """Booked date ranges and the price map, for the booking calendar.

    Optional auth: a signed-in caller's own un-paid hold is not reported as booked, so
    abandoning checkout doesn't lock them out of the dates they were just trying to buy.
    """
    return await get_availability(db, current_user.id if current_user else None)


@router.post("/featured/compose", response_model=ComposeEmailOut)
async def compose_featured_email(
    payload: ComposeEmailIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Draft the announcement so the author can read and edit it *before* they pay.

    Read-only: nothing is written until checkout. The author owns the copy from the
    moment they see it, which is the point of moving this ahead of payment.
    """
    pub = await db.get(Publication, payload.publication_id)
    if pub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    if pub.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only feature your own publication.",
        )

    subject, body, button_text = build_draft(pub)
    end = slot_end_date(payload.start_date, payload.duration_days)
    return ComposeEmailOut(
        subject=subject,
        body=body,
        button_text=button_text,
        suggested_send_at=suggested_send_at(payload.start_date, end),
    )


@router.post("/featured/checkout", response_model=FeatureCheckoutOut)
async def featured_checkout(
    payload: FeatureCheckoutIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Hold the dates for 30 minutes and return a Stripe Checkout URL to redirect to.

    Carries the announcement the author composed and signed off on in the wizard.
    """
    return await create_checkout(
        db,
        user=current_user,
        publication_id=payload.publication_id,
        start_date=payload.start_date,
        duration_days=payload.duration_days,
        email_subject=payload.email_subject.strip(),
        email_body=payload.email_body.strip(),
        email_button_text=payload.email_button_text.strip(),
        email_scheduled_at=payload.email_scheduled_at,
        email_timezone=payload.email_timezone.strip(),
    )


@router.post("/featured/{publication_id}/click", status_code=status.HTTP_204_NO_CONTENT)
async def featured_click(publication_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Record an outbound click on the featured publication.

    Public and unauthenticated — guests click too, and this is fired via
    `navigator.sendBeacon`, which cannot set an Authorization header. A click on a
    publication that isn't currently featured is silently ignored, so this is safe
    to call from any publication page.
    """
    await record_click(db, publication_id)


@router.post("/featured/{publication_id}/impression", status_code=status.HTTP_204_NO_CONTENT)
async def featured_impression(
    publication_id: uuid.UUID,
    payload: FeaturedImpressionIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """Record a unique impression on the visible featured card.

    Public like clicks because guests see the card too. Signed-in requests include
    auth through the normal optional dependency so the backend can dedupe a visitor
    who saw the slot logged out and later logged in.
    """
    await record_impression(
        db,
        publication_id,
        user_id=current_user.id if current_user else None,
        visitor_id=payload.visitor_id,
    )


@router.post("/featured/support", status_code=status.HTTP_204_NO_CONTENT)
async def featured_support(payload: SupportRequestIn):
    """Contact-support form on the featured section: emails the site owner.

    Public — a prospective buyer may not have signed in yet. Field lengths are capped
    in the schema so this cannot be used to relay bulk mail.
    """
    sent = await send_support_request(
        from_name=payload.name.strip(),
        from_email=payload.email,
        subject=payload.subject.strip(),
        message=payload.message.strip(),
    )
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send your message right now. Please email us directly.",
        )


@router.post("/featured/{slot_id}/review", response_model=SlotReviewOut)
async def review_featured_slot(
    slot_id: uuid.UUID,
    data: AdminPasswordIn,
    db: AsyncSession = Depends(get_db),
):
    """Fetch a booking (and its announcement) so the admin can review before deciding.

    POST rather than GET: the admin password goes in the body, so it never lands in a
    URL, browser history or a referrer header. Same gate as the approve endpoint.
    """
    if not settings.CLAIM_APPROVE_PASSWORD or data.password != settings.CLAIM_APPROVE_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    slot = await get_slot_for_review(db, slot_id)
    email = await get_email_for_slot(db, slot_id)
    pub = slot.publication

    return SlotReviewOut(
        slot_id=slot.id,
        publication_title=pub.title if pub else None,
        publication_url=pub.url if pub else None,
        publication_description=pub.description if pub else None,
        buyer_name=slot.user.name if slot.user else None,
        buyer_email=slot.user.email if slot.user else None,
        start_date=slot.start_date,
        end_date=slot.end_date,
        duration_days=slot.duration_days,
        amount_cents=slot.amount_cents,
        currency=slot.currency,
        approval_status=slot.approval_status,
        email_subject=email.subject if email else None,
        email_body=email.body if email else None,
        email_button_text=email.button_text if email else None,
        email_finalised=bool(email and email.author_approved),
        email_status=email.status if email else None,
        email_scheduled_at=email.scheduled_at if email else None,
        email_timezone=email.author_timezone if email else None,
    )


@router.post("/featured/{slot_id}/approve", response_model=ApproveSlotOut)
async def approve_featured_slot(
    slot_id: uuid.UUID,
    data: ApproveSlotRequest,
    db: AsyncSession = Depends(get_db),
):
    """Admin approves (or rejects) a paid booking. Approval is what lets it go live.

    Guarded by the shared admin password, exactly like `approve_claim` — no auth
    dependency, and the password arrives in the body rather than the URL.
    """
    if not settings.CLAIM_APPROVE_PASSWORD or data.password != settings.CLAIM_APPROVE_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    slot = await approve_slot(db, slot_id, approve=data.approve)
    return ApproveSlotOut(ok=True, slot_id=slot.id, approval_status=slot.approval_status)


def _email_out(email) -> FeaturedEmailOut:
    """Serialize an announcement. `slot` is eager-loaded by the helpers that fetch it."""
    slot = getattr(email, "slot", None)
    pub = getattr(email, "publication", None)
    return FeaturedEmailOut(
        id=email.id,
        slot_id=email.slot_id,
        publication_id=email.publication_id,
        publication_title=pub.title if pub else None,
        start_date=slot.start_date if slot else None,
        end_date=slot.end_date if slot else None,
        subject=email.subject,
        body=email.body,
        button_text=email.button_text,
        author_approved=email.author_approved,
        admin_approved=email.admin_approved,
        status=email.status,
        scheduled_at=email.scheduled_at,
        author_timezone=email.author_timezone,
        sent_at=email.sent_at,
    )


@router.get("/featured/my-bookings", response_model=list[MyBookingOut])
async def my_featured_bookings(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """The author's own live and upcoming bookings, so they can see where each stands."""
    slots = await get_my_bookings(db, current_user.id)
    return [
        MyBookingOut(
            id=s.id,
            publication_id=s.publication_id,
            publication_title=s.publication.title if s.publication else None,
            start_date=s.start_date,
            end_date=s.end_date,
            approval_status=s.approval_status,
            is_active=s.is_active,
            click_count=s.click_count,
            impression_count=s.impression_count,
        )
        for s in slots
    ]


@router.get("/featured/my-emails", response_model=list[FeaturedEmailOut])
async def my_featured_emails(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Announcements for this author's bookings, at every status — draft, scheduled,
    sending, sent, cancelled — so the card can keep showing one even after it sends."""
    drafts = await get_author_drafts(db, current_user.id)
    return [
        _email_out(d)
        for d in drafts
    ]


@router.patch("/featured/emails/{email_id}", response_model=FeaturedEmailOut)
async def edit_featured_email(
    email_id: uuid.UUID,
    data: FeaturedEmailUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """The author edits the announcement copy, while it is still a draft."""
    email = await update_draft(
        db,
        email_id,
        current_user.id,
        subject=data.subject.strip(),
        body=data.body.strip(),
        button_text=data.button_text.strip(),
    )
    return _email_out(email)


@router.post("/featured/emails/{email_id}/approve", response_model=FeaturedEmailOut)
async def approve_featured_email(
    email_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """The author's half of the two-key approval. Schedules the send if the admin's is in."""
    email = await approve_draft_as_author(db, email_id, current_user.id)
    return _email_out(email)


@router.post("/featured/reconcile", response_model=ReconcileOut)
async def featured_reconcile(
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
    db: AsyncSession = Depends(get_db),
):
    """Expire lapsed holds/finished bookings and activate today's. Run by cron every 5h."""
    if not settings.CRON_SECRET or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing cron secret"
        )
    return await reconcile_slots(db)
