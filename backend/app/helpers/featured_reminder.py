"""The "your featured slot ends today" reminder.

Run from the scheduler's hourly tick. On the final day of a paid, approved run we
email the author their numbers and a link to book the next one.

Idempotency is the whole design problem here: the tick fires every hour, so without
a durable marker the author would be emailed once an hour for their entire last day.
`FeaturedSlot.expiry_reminder_sent_at` is that marker, and it is committed per slot
immediately after that slot's send — mirroring `featured_email.send_due_emails`, so
a crash midway through a batch never re-sends to the authors already reached.
"""

import logging
from datetime import date, datetime, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.helpers.email import send_feature_expiring_notification
from app.models.featured_slot import FeaturedSlot
from app.settings import settings

logger = logging.getLogger(__name__)

# Don't mail anyone in the middle of their night. The tick is hourly, so the send
# lands somewhere in [13:00, 14:00) UTC — late morning in the US, evening in Asia.
# A reminder that arrives at 2am reads as spam and wastes the last day it's about.
MORNING_HOUR_UTC = 13


def renewal_url(slot_id) -> str:
    """Deep link that opens the renewal modal for this booking.

    Carries no auth of its own: the dashboard prompts for login if needed, and the
    renewal endpoint checks ownership server-side.
    """
    return f"{settings.FRONTEND_URL}/dashboard?renew={slot_id}"


async def send_expiry_reminders(db: AsyncSession) -> dict:
    """Email the author of every run ending today that it ends today.

    Only paid *and* approved runs qualify — an unapproved booking never went live,
    so there is nothing to extend and nothing to report numbers on.
    """
    now = datetime.now(timezone.utc)
    if now.hour < MORNING_HOUR_UTC:
        return {"reminders_sent": 0, "skipped_early": True}

    today = date.today()
    result = await db.execute(
        select(FeaturedSlot)
        .options(
            selectinload(FeaturedSlot.publication),
            selectinload(FeaturedSlot.user),
        )
        .where(
            and_(
                FeaturedSlot.end_date == today,
                FeaturedSlot.status == "paid",
                FeaturedSlot.approval_status == "approved",
                FeaturedSlot.expiry_reminder_sent_at.is_(None),
            )
        )
    )
    slots = result.scalars().all()

    sent = 0
    for slot in slots:
        pub = slot.publication
        user = slot.user
        if pub is None or user is None:
            # The row is orphaned (publication or user deleted). Stamp it so we don't
            # re-examine it every hour for the rest of the day.
            slot.expiry_reminder_sent_at = now
            await db.commit()
            continue

        try:
            await send_feature_expiring_notification(
                to_email=user.email,
                author_name=user.name,
                publication=pub,
                slot=slot,
                renew_url=renewal_url(slot.id),
            )
        except Exception:  # noqa: BLE001
            # send_feature_expiring_notification is already best-effort, so this only
            # catches something genuinely unexpected. One bad row must not stop the
            # rest of the batch — leave the stamp unset so the next tick retries it.
            logger.exception("Expiry reminder failed for slot %s", slot.id)
            continue

        # Stamp and commit per slot: if the process dies on the next one, this author
        # is not emailed again.
        slot.expiry_reminder_sent_at = now
        await db.commit()
        sent += 1

    return {"reminders_sent": sent, "skipped_early": False}
