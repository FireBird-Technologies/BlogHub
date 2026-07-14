"""The marketing email announcing a featured publication to BlogHub's subscribers.

Lifecycle: drafted from the publication's own content when the admin approves the
booking, then it needs *two* approvals — the author's and the admin's. Whichever
lands second schedules it for 24 hours out, and the scheduler sends it to every
subscribed user.
"""

import logging
import uuid
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.helpers.auth import create_unsubscribe_token
from app.helpers.email import _publication_detail_url, send_featured_marketing_email
from app.models.featured_email import FeaturedEmail
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


def build_draft(publication) -> tuple[str, str]:
    """Compose the subject and body from a publication's own content.

    The author writes and edits plain text — no markup to get wrong. The link to the
    publication is NOT part of the body: it is rendered at send time as the linked
    title, so the author cannot accidentally break or delete it while editing.
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
    return subject, "\n".join(lines)


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

    subject, body = build_draft(slot.publication)
    email = FeaturedEmail(
        slot_id=slot.id,
        publication_id=slot.publication_id,
        subject=subject,
        body=body,
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

    The clock runs from when the publication is actually *featured*, not from the
    approval: a booking approved today but starting next week would otherwise announce
    "featured this week" a week before it is. So the send is 24 hours after the run
    goes live — which for a run that is already live means 24 hours from now.

    Does not commit — the caller owns the transaction.
    """
    if email.status != "draft" or not (email.author_approved and email.admin_approved):
        return False

    now = datetime.now(timezone.utc)

    # When does this booking actually go live? A future start date is midnight UTC on
    # that day; a run already under way went live in the past, so we start from now.
    slot = await db.get(FeaturedSlot, email.slot_id)
    goes_live = now
    send_at = now + timedelta(hours=SEND_DELAY_HOURS)

    if slot is not None:
        start = datetime.combine(slot.start_date, time.min, tzinfo=timezone.utc)
        goes_live = max(now, start)
        send_at = goes_live + timedelta(hours=SEND_DELAY_HOURS)

        # Never announce a run that will already be over. If the delay would push the
        # send past the last day (a booking approved very late), send on the next tick
        # instead — a late announcement still beats one for a feature nobody can see.
        run_ends = datetime.combine(slot.end_date, time.max, tzinfo=timezone.utc)
        if send_at > run_ends:
            send_at = now

    email.status = "scheduled"
    email.scheduled_at = send_at
    return True


async def send_due_emails(db: AsyncSession) -> dict:
    """Send every scheduled email whose time has come. Called by the scheduler.

    Each email is flipped to "sent" and committed *before* a single message goes out.
    A crash mid-blast then means some subscribers miss it — which is far better than a
    restart re-sending the whole list to everyone who already got it.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(
        # Eager-load the publication and its author: their details are rendered into
        # the email at send time, and a lazy load on an async session would blow up
        # mid-blast.
        select(FeaturedEmail)
        .options(selectinload(FeaturedEmail.publication).selectinload(Publication.author))
        .where(
            and_(
                FeaturedEmail.status == "scheduled",
                FeaturedEmail.scheduled_at.is_not(None),
                FeaturedEmail.scheduled_at <= now,
            )
        )
    )
    due = result.scalars().all()
    if not due:
        return {"emails_sent": 0, "recipients": 0}

    subs = await db.execute(
        select(User.id, User.email, User.name).where(User.subscribed_only.is_(True))
    )
    subscribers = subs.all()

    emails_sent = 0
    total_recipients = 0

    for email in due:
        # Claim it first, so a crash cannot cause a re-blast.
        claimed = await db.execute(
            update(FeaturedEmail)
            .where(
                and_(FeaturedEmail.id == email.id, FeaturedEmail.status == "scheduled")
            )
            .values(status="sent", sent_at=now, recipient_count=len(subscribers))
        )
        await db.commit()
        if not claimed.rowcount:
            continue  # someone else already claimed it

        pub = email.publication
        link_title = (pub.title if pub else "").strip() or "Read the publication"
        link_url = _publication_detail_url(pub) if pub else settings.FRONTEND_URL
        author = getattr(pub, "author", None) if pub else None

        for user_id, to_email, name in subscribers:
            token = create_unsubscribe_token(user_id)
            await send_featured_marketing_email(
                to_email=to_email,
                subject=email.subject,
                body=email.body.replace(NAME_PLACEHOLDER, name or "there"),
                link_title=link_title,
                link_url=link_url,
                category=pub.category if pub else None,
                author_name=author.name if author else None,
                image_url=pub.image_url if pub else None,
                unsubscribe_token=token,
            )

        emails_sent += 1
        total_recipients += len(subscribers)
        logger.info(
            "Featured marketing email %s sent to %d subscribers", email.id, len(subscribers)
        )

    return {"emails_sent": emails_sent, "recipients": total_recipients}


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
    db: AsyncSession, email_id: uuid.UUID, user_id: uuid.UUID, *, subject: str, body: str
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
