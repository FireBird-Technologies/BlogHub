"""Paid "featured publication" slots: availability, Stripe checkout, reconciliation.

Only one publication is featured site-wide at a time, so a booking reserves an
exclusive calendar range. Dates are inclusive `date` values (no time component):
two ranges overlap iff `a.start <= b.end AND a.end >= b.start`.
"""

import logging
import uuid
from datetime import date, datetime, timedelta, timezone

import stripe
from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.concurrency import run_in_threadpool

from app.helpers.email import (
    send_feature_pending_review_notification,
    send_feature_purchase_notification,
)
from app.helpers.publications import _batch_claims, _batch_meta, _pub_to_out
from app.models.featured_slot import FeaturedSlot
from app.models.publication import Publication
from app.schemas.featured import (
    ActiveFeatureOut,
    FeatureCheckoutOut,
    FeaturedAvailabilityOut,
    FeaturedSlotOut,
    ReconcileOut,
)
from app.settings import settings

logger = logging.getLogger(__name__)

# duration_days -> price in cents. This is the *display* price (shown in the UI and
# stored on the booking). The amount actually charged comes from the Stripe Price
# below — see _stripe_price_id(). Keep the two in sync.
FEATURE_PRICES_CENTS: dict[int, int] = {7: 3000}


def _stripe_price_id(duration_days: int) -> str | None:
    """The pre-created one-time Stripe Price (`price_...`) for a run of this length.

    Prices live in the Stripe dashboard rather than being sent per-session, so the
    amount can be changed there without a deploy. Add a settings field per new tier.
    """
    return {7: settings.STRIPE_FEATURED_PRICE_ID_7D}.get(duration_days)

# How long a pending (unpaid) booking reserves its dates. Stripe's minimum
# checkout-session lifetime is also 30 minutes, so we set both to the same value:
# Stripe then refuses to complete a session whose hold we have already released.
HOLD_MINUTES = 30

# How far ahead a slot may be booked.
BOOKING_HORIZON_DAYS = 180

CURRENCY = "usd"

# Statuses that reserve their dates. `expired`/`cancelled` rows never block.
BLOCKING_STATUSES = ("pending", "paid")

# Serializes the check-then-insert in create_checkout against concurrent buyers.
_BOOKING_LOCK_KEY = 0x8106_0BF1


def slot_end_date(start: date, duration_days: int) -> date:
    """End date is inclusive: a 7-day booking starting Mon ends the following Sun."""
    return start + timedelta(days=duration_days - 1)


def _blocking_clause():
    """Rows that currently reserve their dates: paid, or a hold that hasn't lapsed.

    A lapsed hold frees its dates immediately here, without waiting for the cron
    job — the job only does the durable bookkeeping.
    """
    now = datetime.now(timezone.utc)
    return and_(
        FeaturedSlot.status.in_(BLOCKING_STATUSES),
        or_(
            FeaturedSlot.status == "paid",
            FeaturedSlot.hold_expires_at > now,
        ),
    )


async def get_availability(
    db: AsyncSession, user_id: uuid.UUID | None = None
) -> FeaturedAvailabilityOut:
    """Booked ranges from today onwards, plus the price map, for the booking calendar.

    A caller's own un-paid hold is *not* shown as booked: they abandoned that checkout,
    and starting a new one releases it, so those days are genuinely still theirs to
    take. Showing them greyed out would lock a buyer out of the dates they just tried
    to buy for the next 30 minutes.
    """
    today = date.today()
    conditions = [_blocking_clause(), FeaturedSlot.end_date >= today]
    if user_id is not None:
        conditions.append(
            or_(
                FeaturedSlot.user_id != user_id,
                FeaturedSlot.status != "pending",
            )
        )
    result = await db.execute(
        select(FeaturedSlot).where(and_(*conditions)).order_by(FeaturedSlot.start_date)
    )
    slots = result.scalars().all()
    return FeaturedAvailabilityOut(
        booked=[
            FeaturedSlotOut(start_date=s.start_date, end_date=s.end_date, status=s.status)
            for s in slots
        ],
        prices=dict(FEATURE_PRICES_CENTS),
        min_start_date=today,
        max_start_date=today + timedelta(days=BOOKING_HORIZON_DAYS),
    )


async def _range_is_taken(db: AsyncSession, start: date, end: date) -> bool:
    result = await db.execute(
        select(FeaturedSlot.id).where(
            and_(
                _blocking_clause(),
                FeaturedSlot.start_date <= end,
                FeaturedSlot.end_date >= start,
            )
        )
    )
    return result.first() is not None


async def _range_is_taken_by_other(
    db: AsyncSession,
    user_id: uuid.UUID,
    exclude_slot_id: uuid.UUID,
    start: date,
    end: date,
) -> bool:
    """Is this range blocked by anyone *other* than the hold we are about to reuse?

    A buyer re-taking their own held dates must not be blocked by that very hold, but
    must still lose to a competing paid booking, or to anyone else's live hold.
    """
    result = await db.execute(
        select(FeaturedSlot.id).where(
            and_(
                _blocking_clause(),
                FeaturedSlot.id != exclude_slot_id,
                FeaturedSlot.start_date <= end,
                FeaturedSlot.end_date >= start,
                # The buyer's own other pending holds don't block them either — those
                # get released or reused on their next checkout.
                or_(
                    FeaturedSlot.user_id != user_id,
                    FeaturedSlot.status != "pending",
                ),
            )
        )
    )
    return result.first() is not None


async def _find_own_hold(
    db: AsyncSession, user_id: uuid.UUID, start: date, end: date
) -> FeaturedSlot | None:
    """The buyer's own un-paid hold standing in the way of this date range, if any.

    Only a hold that *overlaps* the dates being bought is in the way. A hold on other
    dates is an independent checkout — possibly still open in another tab — and must be
    left alone: a publication may legitimately have several bookings, and a buyer may
    be part-way through more than one.

    Only ever considers `pending` rows; a paid booking is never reused or released.
    """
    result = await db.execute(
        select(FeaturedSlot)
        .where(
            and_(
                FeaturedSlot.user_id == user_id,
                FeaturedSlot.status == "pending",
                FeaturedSlot.start_date <= end,
                FeaturedSlot.end_date >= start,
            )
        )
        .order_by(FeaturedSlot.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def create_checkout(
    db: AsyncSession,
    *,
    user,
    publication_id: uuid.UUID,
    start_date: date,
    duration_days: int,
) -> FeatureCheckoutOut:
    """Reserve the range with a 30-minute hold and open a Stripe Checkout session.

    Payment is confirmed by the Stripe webhook, never by the browser returning to
    the success URL.
    """
    if not settings.STRIPE_SECRET_KEY:
        # Bail out before touching the DB so a misconfigured deploy leaves no
        # phantom hold blocking the calendar.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payments are not configured yet. Please try again later.",
        )

    if duration_days not in FEATURE_PRICES_CENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported duration. Choose one of: {sorted(FEATURE_PRICES_CENTS)} days.",
        )

    price_id = _stripe_price_id(duration_days)
    if not price_id:
        # Same as a missing secret key: bail before writing, so no hold is left behind.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payments are not configured yet. Please try again later.",
        )

    today = date.today()
    if start_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be today or later."
        )
    if start_date > today + timedelta(days=BOOKING_HORIZON_DAYS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can only book up to {BOOKING_HORIZON_DAYS} days ahead.",
        )

    pub = await db.get(Publication, publication_id)
    if pub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    if pub.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only feature your own publication.",
        )

    end_date = slot_end_date(start_date, duration_days)
    amount_cents = FEATURE_PRICES_CENTS[duration_days]

    # Serialize the overlap check against concurrent buyers: a plain check-then-insert
    # would let two people booking the same week both pass.
    await db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": _BOOKING_LOCK_KEY})

    now = datetime.now(timezone.utc)
    hold_expires_at = now + timedelta(minutes=HOLD_MINUTES)

    # If this buyer already holds these dates but never paid, reuse that row rather
    # than expiring it and inserting another. They are re-doing the same checkout —
    # possibly for a *different* publication of theirs, having changed their mind — so
    # we just point the existing hold at whatever they picked this time. One row per
    # held range keeps the history clean and cannot leave a stale hold behind.
    #
    # Their holds on *other* dates are untouched: those are independent checkouts, and
    # a publication is free to have several bookings.
    slot = await _find_own_hold(db, user.id, start_date, end_date)

    if slot is not None:
        # Their own hold covers these dates; the range is theirs to re-take. Only a
        # *different* buyer's booking can block them now.
        if await _range_is_taken_by_other(db, user.id, slot.id, start_date, end_date):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Those dates are no longer available. Please pick another range.",
            )
        if slot.publication_id != pub.id:
            logger.info(
                "Re-pointing hold %s from publication %s to %s",
                slot.id, slot.publication_id, pub.id,
            )
        slot.publication_id = pub.id
        slot.start_date = start_date
        slot.end_date = end_date
        slot.duration_days = duration_days
        slot.amount_cents = amount_cents
        slot.currency = CURRENCY
        slot.hold_expires_at = hold_expires_at
        slot.stripe_session_id = None  # a fresh session replaces the abandoned one
    else:
        if await _range_is_taken(db, start_date, end_date):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Those dates are no longer available. Please pick another range.",
            )
        slot = FeaturedSlot(
            publication_id=pub.id,
            user_id=user.id,
            start_date=start_date,
            end_date=end_date,
            duration_days=duration_days,
            status="pending",
            is_active=False,
            hold_expires_at=hold_expires_at,
            amount_cents=amount_cents,
            currency=CURRENCY,
        )
        db.add(slot)

    await db.flush()  # assign slot.id for the Stripe metadata

    try:
        session = await run_in_threadpool(
            _create_stripe_session, slot, pub, user, price_id, hold_expires_at
        )
    except Exception as exc:  # noqa: BLE001
        # Roll back so the pending row (and its hold on the dates) disappears.
        await db.rollback()
        logger.warning("Stripe checkout session creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach the payment provider. Please try again.",
        ) from exc

    slot.stripe_session_id = session.id
    # Record what Stripe will actually charge, which is whatever the Price says —
    # if someone edits the amount in the dashboard, the booking reflects reality
    # rather than the stale FEATURE_PRICES_CENTS constant.
    if session.amount_total is not None:
        slot.amount_cents = session.amount_total
    if session.currency:
        slot.currency = session.currency
    await db.commit()

    return FeatureCheckoutOut(
        checkout_url=session.url,
        slot_id=slot.id,
        amount_cents=slot.amount_cents,
        start_date=start_date,
        end_date=end_date,
    )


def _create_stripe_session(
    slot: FeaturedSlot, pub: Publication, user, price_id: str, hold_expires_at: datetime
):
    """Blocking Stripe call — always run via run_in_threadpool (the SDK is sync).

    Bills the pre-created one-time Price, so the amount is owned by the Stripe
    dashboard. Which publication and which dates were bought is carried in metadata.
    """
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe.checkout.Session.create(
        mode="payment",
        customer_email=user.email,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/profile?featured=success",
        cancel_url=f"{settings.FRONTEND_URL}/profile?featured=cancelled",
        expires_at=int(hold_expires_at.timestamp()),
        client_reference_id=str(slot.id),
        metadata={
            "slot_id": str(slot.id),
            "publication_id": str(slot.publication_id),
            "publication_title": (pub.title or "")[:400],
            "user_id": str(slot.user_id),
            "start_date": slot.start_date.isoformat(),
            "end_date": slot.end_date.isoformat(),
            "duration_days": str(slot.duration_days),
        },
        # Keyed on the slot *and this attempt's hold expiry*, not the slot alone. A hold
        # is reused when a buyer re-does a checkout (possibly for a different
        # publication), which keeps the slot id — keying on that alone would make Stripe
        # replay the abandoned session, still carrying the old publication.
        idempotency_key=f"{slot.id}:{int(hold_expires_at.timestamp())}",
    )


def _as_dict(obj) -> dict:
    """Normalise a Stripe payload to a plain dict.

    The SDK hands us a `StripeObject`, whose `__getattr__` maps attribute access onto
    key lookup — so calling `.get("id")` on one raises `AttributeError: get` rather
    than returning the id. Converting at the boundary keeps the rest of this function
    working against an ordinary mapping, whatever the SDK does.
    """
    if isinstance(obj, dict):
        return dict(obj)
    to_dict = getattr(obj, "to_dict_recursive", None) or getattr(obj, "to_dict", None)
    if callable(to_dict):
        return to_dict()
    return dict(obj)


async def handle_checkout_completed(db: AsyncSession, session_obj) -> None:
    """Mark the booking paid. Idempotent — Stripe delivers events at least once."""
    session_obj = _as_dict(session_obj)
    session_id = session_obj.get("id")
    slot: FeaturedSlot | None = None

    if session_id:
        result = await db.execute(
            select(FeaturedSlot)
            .options(selectinload(FeaturedSlot.publication), selectinload(FeaturedSlot.user))
            .where(FeaturedSlot.stripe_session_id == session_id)
        )
        slot = result.scalar_one_or_none()

    if slot is None:
        # metadata may itself still be a StripeObject if the SDK only converted the
        # top level — normalise it too before reaching in.
        metadata = _as_dict(session_obj.get("metadata") or {})
        raw_slot_id = metadata.get("slot_id")
        if raw_slot_id:
            try:
                result = await db.execute(
                    select(FeaturedSlot)
                    .options(selectinload(FeaturedSlot.publication), selectinload(FeaturedSlot.user))
                    .where(FeaturedSlot.id == uuid.UUID(raw_slot_id))
                )
                slot = result.scalar_one_or_none()
            except ValueError:
                slot = None

    if slot is None:
        logger.warning("Stripe checkout completed for an unknown slot (session=%s)", session_id)
        return

    if slot.status == "paid":
        return  # already processed — a redelivered event

    if slot.status in ("expired", "cancelled"):
        # Near-unreachable: the Stripe session expires with the hold. If it happens,
        # record the payment but do not activate — the dates may have been resold.
        logger.error(
            "Payment received for a %s featured slot %s (%s → %s) — needs manual review",
            slot.status,
            slot.id,
            slot.start_date,
            slot.end_date,
        )

    slot.status = "paid"
    slot.paid_at = datetime.now(timezone.utc)
    slot.hold_expires_at = None
    slot.stripe_payment_intent_id = session_obj.get("payment_intent")
    await db.commit()

    # After the commit: a failing email must never make us 500 and have Stripe
    # retry a payment we have already recorded.
    #
    # Two separate emails on purpose. The owner's carries the approve/reject buttons,
    # so the buyer must not be CC'd on it; the buyer gets their own receipt telling
    # them the booking is paid and under review.
    await send_feature_purchase_notification(
        slot=slot,
        publication=slot.publication,
        buyer_name=slot.user.name if slot.user else None,
        buyer_email=slot.user.email if slot.user else None,
    )
    await send_feature_pending_review_notification(
        to_email=slot.user.email if slot.user else None,
        buyer_name=slot.user.name if slot.user else None,
        publication=slot.publication,
        slot=slot,
    )

    # Draft the announcement now, so the author can review and approve it immediately
    # rather than waiting on the admin. Best-effort: a drafting failure must not undo
    # a payment we have already recorded, and the admin approval path will draft it
    # if it is somehow missing.
    try:
        from app.helpers.featured_email import create_draft_for_slot

        await create_draft_for_slot(db, slot)
    except Exception:  # noqa: BLE001
        logger.exception("Could not draft the announcement for slot %s", slot.id)

    # Decide the booking's initial state now rather than making the buyer wait for the
    # next scheduler tick:
    #   - the run covers today  -> go live immediately (is_active = true)
    #   - the run starts later  -> stay scheduled (is_active = false); the scheduler
    #     activates it on its start date and retires it after its end date.
    # reconcile_slots does exactly this, and does it under the advisory lock, so we
    # reuse it rather than duplicating the activation rules here.
    await reconcile_slots(db)


async def reconcile_slots(db: AsyncSession) -> ReconcileOut:
    """Expire lapsed holds and finished bookings, then activate today's booking.

    Idempotent — safe to run as often as you like. The cron job is the only writer
    of `is_active`. Order matters: the partial unique index allows just one active
    row, so stale rows must be deactivated before the new one is activated.
    """
    await db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": _BOOKING_LOCK_KEY})
    now = datetime.now(timezone.utc)
    today = date.today()

    # 1. Release holds that were never paid.
    released = await db.execute(
        update(FeaturedSlot)
        .where(
            and_(
                FeaturedSlot.status == "pending",
                FeaturedSlot.hold_expires_at.is_not(None),
                FeaturedSlot.hold_expires_at < now,
            )
        )
        .values(status="expired", is_active=False)
    )

    # 2. Retire bookings whose run has ended.
    finished = await db.execute(
        update(FeaturedSlot)
        .where(and_(FeaturedSlot.status == "paid", FeaturedSlot.end_date < today))
        .values(status="expired", is_active=False)
    )

    # 3. Defensively clear any active row that no longer covers today (must happen
    #    before step 4 or the unique index rejects the new activation).
    cleared = await db.execute(
        update(FeaturedSlot)
        .where(
            and_(
                FeaturedSlot.is_active.is_(True),
                or_(
                    FeaturedSlot.start_date > today,
                    FeaturedSlot.end_date < today,
                    FeaturedSlot.status != "paid",
                ),
            )
        )
        .values(is_active=False)
    )

    # 4. Activate the paid booking covering today (there can be at most one, since
    #    bookings never overlap).
    next_up = await db.execute(
        select(FeaturedSlot.id)
        .where(
            and_(
                FeaturedSlot.status == "paid",
                # Paying is not enough: an unapproved booking is never activated.
                FeaturedSlot.approval_status == "approved",
                FeaturedSlot.start_date <= today,
                FeaturedSlot.end_date >= today,
                FeaturedSlot.is_active.is_(False),
            )
        )
        .order_by(FeaturedSlot.created_at)
        .limit(1)
    )
    activated = 0
    slot_id = next_up.scalar_one_or_none()
    if slot_id is not None:
        await db.execute(
            update(FeaturedSlot).where(FeaturedSlot.id == slot_id).values(is_active=True)
        )
        activated = 1

    await db.commit()

    return ReconcileOut(
        holds_released=released.rowcount or 0,
        deactivated=(finished.rowcount or 0) + (cleared.rowcount or 0),
        activated=activated,
    )


async def get_active_feature(
    db: AsyncSession, user_id: uuid.UUID | None
) -> ActiveFeatureOut | None:
    """The publication currently featured, or None.

    Re-checks the date window and the approval on top of `is_active`, so a stale flag
    (e.g. the scheduler has been down) can never surface an out-of-window or
    unapproved feature.
    """
    today = date.today()
    result = await db.execute(
        select(FeaturedSlot)
        .options(selectinload(FeaturedSlot.publication).selectinload(Publication.author))
        .where(
            and_(
                FeaturedSlot.is_active.is_(True),
                FeaturedSlot.status == "paid",
                FeaturedSlot.approval_status == "approved",
                FeaturedSlot.start_date <= today,
                FeaturedSlot.end_date >= today,
            )
        )
        .limit(1)
    )
    slot = result.scalar_one_or_none()
    if slot is None or slot.publication is None:
        return None

    pub = slot.publication
    upvoted_ids, comment_counts = await _batch_meta(db, [pub], user_id)
    verified_map, my_status_map = await _batch_claims(db, [pub], user_id)

    return ActiveFeatureOut(
        publication=_pub_to_out(
            pub,
            upvoted_ids,
            comment_counts,
            verified_map=verified_map,
            my_status_map=my_status_map,
        ),
        start_date=slot.start_date,
        end_date=slot.end_date,
        click_count=slot.click_count,
    )


async def approve_slot(db: AsyncSession, slot_id: uuid.UUID, *, approve: bool) -> FeaturedSlot:
    """Admin decision on a paid booking. Approving is what lets it go live.

    Rejecting releases the dates by moving `status` to "cancelled": the calendar
    blocks on `status`, never on `approval_status`, so this is what frees the week
    for someone else. The refund itself is handled by hand in the Stripe dashboard.
    """
    result = await db.execute(
        select(FeaturedSlot)
        .options(selectinload(FeaturedSlot.publication), selectinload(FeaturedSlot.user))
        .where(FeaturedSlot.id == slot_id)
    )
    slot = result.scalar_one_or_none()
    if slot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if slot.approval_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This booking has already been {slot.approval_status}.",
        )

    now = datetime.now(timezone.utc)
    slot.approval_status = "approved" if approve else "rejected"
    slot.approved_at = now

    if not approve:
        # Free the dates. Also clear is_active defensively — it should never be set on
        # an unapproved booking, but a stale flag must not survive a rejection.
        slot.status = "cancelled"
        slot.is_active = False

    await db.commit()

    if approve:
        # Go live immediately if the run already covers today, rather than making the
        # buyer wait for the next scheduler tick.
        await reconcile_slots(db)
        # Approving the booking also approves the announcement about it. If the author
        # has already approved their copy, this is the second key and the send is
        # scheduled; if not, it simply waits for them. Best-effort: a failure here must
        # not undo an approval that already succeeded.
        try:
            from app.helpers.email import send_feature_approved_notification
            from app.helpers.featured_email import approve_draft_as_admin

            email = await approve_draft_as_admin(db, slot)
            await send_feature_approved_notification(
                to_email=slot.user.email if slot.user else None,
                author_name=slot.user.name if slot.user else None,
                publication=slot.publication,
                slot=slot,
                announcement_pending=bool(email and not email.author_approved),
            )
        except Exception:  # noqa: BLE001
            logger.exception("Could not approve the announcement for slot %s", slot.id)

    return slot


async def get_slot_for_review(db: AsyncSession, slot_id: uuid.UUID) -> FeaturedSlot:
    """The booking and everything hanging off it, for the admin's review page."""
    result = await db.execute(
        select(FeaturedSlot)
        .options(selectinload(FeaturedSlot.publication), selectinload(FeaturedSlot.user))
        .where(FeaturedSlot.id == slot_id)
    )
    slot = result.scalar_one_or_none()
    if slot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return slot


async def get_my_bookings(db: AsyncSession, user_id: uuid.UUID) -> list[FeaturedSlot]:
    """This author's live and upcoming featured bookings, newest first.

    Excludes lapsed holds and finished runs — only what they can still act on or are
    waiting on.
    """
    today = date.today()
    result = await db.execute(
        select(FeaturedSlot)
        .options(selectinload(FeaturedSlot.publication))
        .where(
            and_(
                FeaturedSlot.user_id == user_id,
                FeaturedSlot.status == "paid",
                FeaturedSlot.end_date >= today,
            )
        )
        .order_by(FeaturedSlot.start_date)
    )
    return list(result.scalars().all())


async def record_click(db: AsyncSession, publication_id: uuid.UUID) -> int:
    """Count a click on the featured *card* (home page / dashboard).

    Deliberately narrow: only the card click is counted, not the detail page's outbound
    links. Those clicks would have happened anyway once a reader is on the page, so
    folding them in would stop the number meaning "traffic the placement sent me".

    Counts ONLY against a booking that is live right now: active, paid, admin-approved,
    and inside its date window. A scheduled, pending-review, rejected or expired booking
    accrues nothing — it isn't on screen, so a click cannot belong to it.

    The predicate deliberately mirrors `get_active_feature` exactly. Trusting `is_active`
    alone would let a stale flag (e.g. the scheduler was down) bank clicks against a
    booking that isn't actually being shown.

    Returns the new total (0 if the publication isn't featured right now).
    """
    today = date.today()
    result = await db.execute(
        update(FeaturedSlot)
        .where(
            and_(
                FeaturedSlot.publication_id == publication_id,
                FeaturedSlot.is_active.is_(True),
                FeaturedSlot.status == "paid",
                FeaturedSlot.approval_status == "approved",
                FeaturedSlot.start_date <= today,
                FeaturedSlot.end_date >= today,
            )
        )
        .values(click_count=FeaturedSlot.click_count + 1)
        .returning(FeaturedSlot.click_count)
    )
    row = result.first()
    await db.commit()
    return row[0] if row else 0
