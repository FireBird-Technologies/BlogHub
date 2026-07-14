"""The marketing email announcing a featured publication to BlogHub's subscribers.

Lifecycle: drafted from the publication's own content when the admin approves the
booking, then it needs *two* approvals — the author's and the admin's. Whichever
lands second schedules it for 24 hours out, and the scheduler sends it to every
subscribed user.

The send is resumable: each delivery is recorded as its own row
(`FeaturedEmailRecipient`) the instant it goes out, so a crash mid-blast can pick up
where it left off — on the next scheduler tick, or the next time the server starts —
without re-sending to anyone already reached. See `send_due_emails`.
"""

import asyncio
import logging
import uuid
from datetime import date, datetime, time, timedelta, timezone
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.helpers.auth import create_unsubscribe_token
from app.helpers.email import send_featured_marketing_email
from app.models.featured_email import FeaturedEmail
from app.models.featured_email_recipient import FeaturedEmailRecipient
from app.models.featured_slot import FeaturedSlot
from app.models.publication import Publication
from app.models.user import User
from app.settings import settings

logger = logging.getLogger(__name__)

# How long after the publication goes live the announcement goes out. The scheduler
# ticks every 5 hours, so the real send lands somewhere in [24h, 29h) after that —
# fine for a marketing blast, and it saves running a second timer.
SEND_DELAY_HOURS = 24

# `{name}` is substituted per recipient at send time; everything else is fixed when
# the draft is created, and the author can edit all of it before approving.
NAME_PLACEHOLDER = "{name}"

# Resend's default plan allows 2 requests/second. A blast fires one request per
# recipient back to back, so without a pause a list of any real size trips the limit
# and the rest of that pass fails. 400ms keeps us under 2.5 req/s with margin for
# jitter — safely resumable either way (see send_due_emails), but pacing correctly
# means fewer stalled passes and faster overall delivery than repeatedly hitting 429s.
SEND_PACE_SECONDS = 0.4


# Shown on the button when the author never set one (drafts created before this
# existed, or a row seeded by hand).
DEFAULT_BUTTON_TEXT = "Read the publication"

# The marketing blast's own UTM tag. Mirrors frontend/src/lib/featuredUtm.ts (same
# utm_source="bloghub", same utm_campaign="featured"), but utm_content is distinct
# from every card/link click there — "marketing_email" — so the buyer's own
# analytics can tell "someone clicked the button in the announcement email" apart
# from "someone clicked the featured card on the site".
_MARKETING_EMAIL_UTM = {
    "utm_source": "bloghub",
    "utm_medium": "email",
    "utm_campaign": "featured",
    "utm_content": "marketing_email",
}


def _with_marketing_email_utm(url: str) -> str:
    """Append the marketing-email UTM tag to an outbound URL.

    Preserves any query string already on the link and never overwrites a param the
    author's own URL already set. Falls back to the raw URL for anything that isn't a
    parseable absolute http(s) link, so a malformed publication URL degrades to a
    plain link rather than breaking the send.
    """
    try:
        parts = urlsplit(url)
        if parts.scheme not in ("http", "https"):
            return url
        query = dict(parse_qsl(parts.query, keep_blank_values=True))
        for key, value in _MARKETING_EMAIL_UTM.items():
            query.setdefault(key, value)
        return urlunsplit(parts._replace(query=urlencode(query)))
    except Exception:  # noqa: BLE001
        return url


def build_draft(publication) -> tuple[str, str, str]:
    """Compose the subject, body and button label from a publication's own content.

    The author writes and edits plain text — no markup to get wrong. The link to the
    publication is NOT part of the body: it is rendered at send time as a single
    button, whose label the author chooses, so they cannot accidentally break or
    delete the link itself while editing.
    """
    title = (publication.title or "").strip()
    description = (publication.description or "").strip()

    subject = f"Featured on BlogHub: {title}"[:200]

    lines = [
        f"Hi {NAME_PLACEHOLDER},",
        "",
        f"{title} is our featured publication on BlogHub this week.",
    ]
    if description:
        lines += ["", description]
    lines += [
        "",
        "— The BlogHub team",
    ]
    return subject, "\n".join(lines), DEFAULT_BUTTON_TEXT


def suggested_send_at(start: date, end: date, tz_name: str | None = None) -> datetime:
    """A sensible default send time: day 2 of the run at 09:00, in the author's zone.

    Day 2 rather than day 1 so the publication is demonstrably live by the time
    subscribers click through. Clamped into the run for a 1-day booking, and pushed
    forward if that moment has already passed.
    """
    zone = timezone.utc
    if tz_name:
        try:
            zone = ZoneInfo(tz_name)
        except Exception:  # noqa: BLE001
            zone = timezone.utc

    day_two = min(start + timedelta(days=1), end)
    at = datetime.combine(day_two, time(hour=9), tzinfo=zone).astimezone(timezone.utc)

    now = datetime.now(timezone.utc)
    if at <= now:
        # The suggestion has already passed (booking a run that's under way) — nudge it
        # to the next whole hour instead of proposing a time in the past.
        at = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
    return at


async def create_draft_for_slot(db: AsyncSession, slot: FeaturedSlot) -> FeaturedEmail:
    """Draft the announcement as soon as the booking is paid.

    Created at payment rather than at approval, so the author can read, edit and
    approve their announcement straight away instead of waiting on the admin.

    Idempotent: `slot_id` is unique, so a redelivered Stripe event does not create a
    second draft.
    """
    existing = await db.execute(select(FeaturedEmail).where(FeaturedEmail.slot_id == slot.id))
    email = existing.scalar_one_or_none()
    if email is not None:
        return email

    subject, body, button_text = build_draft(slot.publication)
    email = FeaturedEmail(
        slot_id=slot.id,
        publication_id=slot.publication_id,
        subject=subject,
        body=body,
        button_text=button_text,
    )
    db.add(email)
    await db.commit()
    return email


async def approve_draft_as_admin(db: AsyncSession, slot: FeaturedSlot) -> FeaturedEmail | None:
    """The admin's key, granted when they approve the booking.

    They have already read the publication in order to approve the booking, so their
    approval of the announcement about it rides along — the author's separate approval
    is the one that gates the send.
    """
    result = await db.execute(select(FeaturedEmail).where(FeaturedEmail.slot_id == slot.id))
    email = result.scalar_one_or_none()
    if email is None:
        # Shouldn't happen (the draft is created at payment), but a booking inserted
        # by hand won't have one — draft it now rather than skipping the announcement.
        email = await create_draft_for_slot(db, slot)

    if email.status not in ("draft", "scheduled"):
        return email

    email.admin_approved = True
    await maybe_schedule(db, email)
    await db.commit()
    return email


async def maybe_schedule(db: AsyncSession, email: FeaturedEmail) -> bool:
    """Schedule the send once BOTH approvals are in. Order of approval doesn't matter.

    The author picks their own send time during checkout, so in the normal flow
    `scheduled_at` is already set and we simply honour it — this only flips the status.

    The fallback below is for a booking that never went through the wizard (one seeded
    by hand), which has no chosen time. There, the clock runs from when the publication
    is actually *featured*, not from the approval: a booking approved today but starting
    next week would otherwise announce "featured this week" a week before it is.

    Does not commit — the caller owns the transaction.
    """
    if email.status != "draft" or not (email.author_approved and email.admin_approved):
        return False

    now = datetime.now(timezone.utc)
    slot = await db.get(FeaturedSlot, email.slot_id)

    if email.scheduled_at is not None:
        # The author chose this. Don't second-guess it — it was validated against the
        # run's bounds at checkout.
        send_at = email.scheduled_at
    else:
        goes_live = now
        send_at = now + timedelta(hours=SEND_DELAY_HOURS)
        if slot is not None:
            start = datetime.combine(slot.start_date, time.min, tzinfo=timezone.utc)
            goes_live = max(now, start)
            send_at = goes_live + timedelta(hours=SEND_DELAY_HOURS)

    # Never announce a run that will already be over — whether the time was chosen or
    # computed. A booking approved very late would otherwise blast subscribers about a
    # feature nobody can still see; sending on the next tick at least lands inside it.
    if slot is not None:
        run_ends = datetime.combine(slot.end_date, time.max, tzinfo=timezone.utc)
        if send_at > run_ends:
            send_at = now

    email.status = "scheduled"
    email.scheduled_at = send_at
    return True


async def send_due_emails(db: AsyncSession) -> dict:
    """Send every scheduled email whose time has come, and resume any still mid-blast.
    Called by the scheduler — every hour, and once at startup, so a stalled blast is
    retried automatically without anyone having to notice or intervene.

    Resumable by construction: every successful delivery is recorded as its own
    `FeaturedEmailRecipient` row, committed immediately after that recipient's email
    goes out — not batched at the end. Before mailing anyone, we work out who (of
    today's subscribers) does NOT already have such a row for this email, and only
    send to that set. So:
      - a crash after recipient 50 of 200 leaves 50 durably recorded; the next pass
        sends only to the remaining 150, never re-sending to the first 50.
      - an email only reaches `status="sent"` once a pass over it sends to zero
        remaining recipients, i.e. everyone currently subscribed has been reached.
      - someone who subscribes mid-blast is picked up on the next pass; someone who
        unsubscribes mid-blast is simply never sent to (their opt-out is respected
        the moment it happens, not after the blast that was already running).

    Sends are paced (see SEND_PACE_SECONDS), not fired back to back, to stay under
    Resend's rate limit — a large subscriber list would otherwise trip it partway
    through and turn every pass into a partial one.
    """
    now = datetime.now(timezone.utc)

    # Pick up anything due to start, and anything still going from a previous,
    # possibly-crashed pass.
    result = await db.execute(
        # Eager-load the publication and its author: their details are rendered into
        # the email at send time, and a lazy load on an async session would blow up
        # mid-blast.
        select(FeaturedEmail)
        .options(selectinload(FeaturedEmail.publication).selectinload(Publication.author))
        .where(
            or_(
                FeaturedEmail.status == "sending",
                and_(
                    FeaturedEmail.status == "scheduled",
                    FeaturedEmail.scheduled_at.is_not(None),
                    FeaturedEmail.scheduled_at <= now,
                ),
            )
        )
    )
    due = result.scalars().all()
    if not due:
        return {"emails_sent": 0, "recipients": 0}

    emails_completed = 0
    total_recipients = 0

    for email in due:
        # Claim it into "sending" — not "sent". This is what makes a crash safe to
        # retry: the row stays visible to the query above until every recipient is
        # actually recorded, however many passes that takes.
        claimed = await db.execute(
            update(FeaturedEmail)
            .where(
                and_(
                    FeaturedEmail.id == email.id,
                    FeaturedEmail.status.in_(("scheduled", "sending")),
                )
            )
            .values(status="sending")
        )
        await db.commit()
        if not claimed.rowcount:
            continue  # a concurrent tick already claimed it

        # Subscribers as of *this pass*, minus anyone this email has already reached.
        already_sent = await db.execute(
            select(FeaturedEmailRecipient.user_id).where(
                FeaturedEmailRecipient.email_id == email.id
            )
        )
        already_sent_ids = {row[0] for row in already_sent.all()}

        # The publication's owner always gets their own announcement, even if they've
        # turned off the general subscriber digest — this is the email *about their
        # publication*, not the weekly blast, and they bought the slot it's for.
        owner_id = email.publication.user_id if email.publication else None
        subs = await db.execute(
            select(User.id, User.email, User.name).where(
                or_(User.subscribed_only.is_(True), User.id == owner_id)
            )
        )
        pending = [row for row in subs.all() if row[0] not in already_sent_ids]

        if pending:
            pub = email.publication
            raw_link_url = (pub.url if pub else None) or settings.FRONTEND_URL
            link_url = _with_marketing_email_utm(raw_link_url)
            button_text = (email.button_text or "").strip() or DEFAULT_BUTTON_TEXT

            for i, (user_id, to_email, name) in enumerate(pending):
                if i > 0:
                    # Paced, not batched: keeps every send under Resend's rate limit
                    # instead of firing the whole list back to back.
                    await asyncio.sleep(SEND_PACE_SECONDS)
                token = create_unsubscribe_token(user_id)
                await send_featured_marketing_email(
                    to_email=to_email,
                    subject=email.subject,
                    body=email.body.replace(NAME_PLACEHOLDER, name or "there"),
                    button_text=button_text,
                    link_url=link_url,
                    unsubscribe_token=token,
                )
                # Recorded — and committed — right after this one send, not batched
                # with the rest. If the process dies on the very next line, this
                # person is still durably marked as reached.
                #
                # ON CONFLICT DO NOTHING rather than a plain insert: this app's
                # scheduler is a single in-process loop, so nothing today sends the
                # same email concurrently — but the unique index on (email_id,
                # user_id) exists precisely so that if it ever were (e.g. the backend
                # scaled to more than one instance, per the caveat already noted in
                # app/scheduler.py), two overlapping attempts to record the same
                # recipient resolve to one row instead of an unhandled IntegrityError
                # aborting the whole pass.
                await db.execute(
                    pg_insert(FeaturedEmailRecipient)
                    .values(email_id=email.id, user_id=user_id)
                    .on_conflict_do_nothing(
                        index_elements=["email_id", "user_id"]
                    )
                )
                await db.commit()

            total_recipients += len(pending)
            logger.info(
                "Featured marketing email %s: sent to %d recipient(s) this pass",
                email.id,
                len(pending),
            )

        # Complete only if nobody currently subscribed (or the owner) is still owed a
        # send. If new subscribers arrive mid-loop they'll show up as "pending" again
        # on the very next tick, so this can't under-count — worst case it takes one
        # extra pass.
        still_pending = await db.execute(
            select(User.id)
            .where(or_(User.subscribed_only.is_(True), User.id == owner_id))
            .where(
                ~User.id.in_(
                    select(FeaturedEmailRecipient.user_id).where(
                        FeaturedEmailRecipient.email_id == email.id
                    )
                )
            )
            .limit(1)
        )
        if still_pending.first() is None:
            recipient_total = await db.execute(
                select(func.count(FeaturedEmailRecipient.id)).where(
                    FeaturedEmailRecipient.email_id == email.id
                )
            )
            await db.execute(
                update(FeaturedEmail)
                .where(FeaturedEmail.id == email.id)
                .values(
                    status="sent",
                    sent_at=datetime.now(timezone.utc),
                    recipient_count=recipient_total.scalar_one(),
                )
            )
            await db.commit()
            emails_completed += 1
            logger.info("Featured marketing email %s fully sent", email.id)

    return {"emails_sent": emails_completed, "recipients": total_recipients}


async def get_email_for_slot(db: AsyncSession, slot_id: uuid.UUID) -> FeaturedEmail | None:
    """The announcement drafted for a booking, if there is one."""
    result = await db.execute(select(FeaturedEmail).where(FeaturedEmail.slot_id == slot_id))
    return result.scalar_one_or_none()


async def get_author_drafts(db: AsyncSession, user_id: uuid.UUID) -> list[FeaturedEmail]:
    """Marketing emails for this author's bookings that they can still act on."""
    result = await db.execute(
        select(FeaturedEmail)
        # `slot` is eager-loaded too: the API exposes each announcement's date range, so
        # an author with several runs on one publication can tell them apart.
        .options(selectinload(FeaturedEmail.publication), selectinload(FeaturedEmail.slot))
        .join(FeaturedSlot, FeaturedSlot.id == FeaturedEmail.slot_id)
        .where(
            and_(
                FeaturedSlot.user_id == user_id,
                FeaturedEmail.status.in_(("draft", "scheduled")),
            )
        )
        .order_by(FeaturedEmail.created_at.desc())
    )
    return list(result.scalars().all())


async def _owned_email(db: AsyncSession, email_id: uuid.UUID, user_id: uuid.UUID) -> FeaturedEmail:
    """Fetch a draft, asserting the caller owns the booking it belongs to."""
    from fastapi import HTTPException, status

    result = await db.execute(
        select(FeaturedEmail)
        .options(selectinload(FeaturedEmail.publication), selectinload(FeaturedEmail.slot))
        .join(FeaturedSlot, FeaturedSlot.id == FeaturedEmail.slot_id)
        .where(and_(FeaturedEmail.id == email_id, FeaturedSlot.user_id == user_id))
    )
    email = result.scalar_one_or_none()
    if email is None:
        # Same response whether it doesn't exist or isn't theirs — don't leak which.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    return email


async def update_draft(
    db: AsyncSession,
    email_id: uuid.UUID,
    user_id: uuid.UUID,
    *,
    subject: str,
    body: str,
    button_text: str,
) -> FeaturedEmail:
    """Author edits the copy — only until they approve it.

    Approving locks the wording: they have signed off on exactly this text, and it
    must not change afterwards behind the admin's back.
    """
    from fastapi import HTTPException, status

    email = await _owned_email(db, email_id, user_id)
    if email.author_approved or email.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You've finalised this announcement, so it can no longer be edited.",
        )
    email.subject = subject
    email.body = body
    email.button_text = button_text
    await db.commit()
    return email


async def approve_draft_as_author(
    db: AsyncSession, email_id: uuid.UUID, user_id: uuid.UUID
) -> FeaturedEmail:
    """The author's half of the two-key approval."""
    from fastapi import HTTPException, status

    email = await _owned_email(db, email_id, user_id)
    if email.author_approved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You've already finalised this announcement.",
        )
    if email.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This email is already {email.status}.",
        )
    email.author_approved = True
    await maybe_schedule(db, email)
    await db.commit()
    return email
