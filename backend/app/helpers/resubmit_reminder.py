"""The "resubmit to get back on top" reminder.

Run from the scheduler's hourly tick. Four weeks after a publication was submitted we
email its author once, asking them to resubmit it so it returns to the top of the feed.

Exactly one email per publication, ever. `Publication.resubmit_reminder_sent_at` is
the durable marker: non-NULL means done, and nothing clears it — not an edit, not a
resubmit. Resetting it on resubmit would make the nudge loop, mailing the author again
four weeks after every action they take in response to it. It is committed per row
immediately after that row's send, so a crash midway through a batch never re-mails the
authors already reached.

Only publications submitted after the feature shipped are eligible: migration 0033
backfills every pre-existing row with a timestamp, so the back catalogue is excluded
permanently and nobody is nudged about a listing they submitted long before this
existed.

Unlike the featured expiry reminder there is no send-hour gate: that email is about
a run ending *today*, so a 2am arrival wastes the day it is asking you to act on.
This one carries no deadline, so it goes out on the first tick past the four-week
mark whatever the hour, rather than holding for a "nice" local time.

BATCH_LIMIT caps each tick's work. With the back catalogue excluded there is no
backlog to drain, so it is a safety rail against an unexpected surge of due rows
tripping Resend's rate limit, not a throughput target.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.helpers.email import send_publication_resubmit_reminder
from app.models.publication import Publication

logger = logging.getLogger(__name__)

# How long after submission the nudge goes out.
REMINDER_AFTER = timedelta(weeks=4)

# Max sends per tick. Keeps any single tick's work bounded (see module docstring).
BATCH_LIMIT = 100


async def send_resubmit_reminders(db: AsyncSession) -> dict:
    """Email the author of every publication that turned four weeks old.

    Sends on the first tick past the mark, at any hour of the day, once per
    publication and never again.

    Unlisted publications are skipped: they exist only to back a paid featured slot,
    were never really "submitted" by their owner, and have no listing to refresh.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - REMINDER_AFTER
    result = await db.execute(
        select(Publication)
        .options(selectinload(Publication.author))
        .where(
            and_(
                Publication.created_at <= cutoff,
                Publication.is_unlisted.is_(False),
                Publication.resubmit_reminder_sent_at.is_(None),
            )
        )
        .order_by(Publication.created_at)
        .limit(BATCH_LIMIT)
    )
    publications = result.scalars().all()

    sent = 0
    failed = 0
    for pub in publications:
        author = pub.author
        if author is None or not author.email:
            # Nobody to mail. Stamp it so we don't re-examine the row every hour.
            pub.resubmit_reminder_sent_at = now
            await db.commit()
            continue

        try:
            delivered = await send_publication_resubmit_reminder(
                to_email=author.email,
                author_name=author.name,
                publication=pub,
            )
        except Exception:  # noqa: BLE001
            # The send is best-effort internally, so this only catches something
            # genuinely unexpected. One bad row must not stop the rest of the batch —
            # leave the stamp unset so the next tick retries it.
            logger.exception("Resubmit reminder failed for publication %s", pub.id)
            continue

        if not delivered:
            # Resend rejected it, or the request never left the box (DNS/timeout).
            # Do NOT stamp: stamping here would mark an email that was never sent as
            # sent, permanently excluding the row and silently dropping the reminder.
            failed += 1
            continue

        # Stamp and commit per row: if the process dies on the next one, this author
        # is not emailed again.
        pub.resubmit_reminder_sent_at = now
        await db.commit()
        sent += 1

    if failed:
        logger.warning("Resubmit reminders: %s send(s) failed and will be retried", failed)
    return {"reminders_sent": sent, "send_failures": failed}
