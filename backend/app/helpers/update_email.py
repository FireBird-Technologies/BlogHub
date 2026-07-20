"""DB-driven product-update email campaigns, sent one batch per day.

An admin inserts a row into `update_emails` via raw SQL (no UI/API/CLI). The scheduler
calls `run_due_update_emails` every hour; when the UTC hour matches a campaign's
`send_hour` and it hasn't already run today, one batch of `batch_size` subscribers who
haven't received it yet is mailed. Every delivery is recorded in `update_email_sends`
immediately, so the batch is crash/redeploy-resumable and never double-sends.

Mirrors the resumable design of `app/helpers/featured_email.py::send_due_emails`, but
drips one daily batch instead of blasting the whole list at once.
"""

import asyncio
import logging
import uuid
from datetime import datetime, time, timezone

from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.selectable import Select

from app.helpers.auth import create_unsubscribe_token
from app.helpers.email import send_update_email
from app.models.update_email import UpdateEmail
from app.models.update_email_send import UpdateEmailSend
from app.models.user import User
from app.settings import settings

logger = logging.getLogger(__name__)

# Resend's default plan allows 2 requests/second. Pace sends so a batch of any real size
# stays under the limit — same value the featured blast uses (SEND_PACE_SECONDS there).
SEND_PACE_SECONDS = 0.4


def _segment_query(user_filter: str) -> Select:
    """The recipient segment for a campaign. Only "all" (every subscribed user) is
    implemented; BlogHub has no plan/tier concept. Unknown filters fall back to "all".
    """
    return select(User.id, User.email, User.name).where(
        User.subscribed_only.is_(True),
        User.email.isnot(None),
        User.email != "",
    )


def _effective_send_hour(campaign: UpdateEmail) -> int:
    return campaign.send_hour if campaign.send_hour >= 0 else settings.UPDATE_EMAIL_SEND_HOUR


async def run_update_email_batch(db: AsyncSession, email_id: uuid.UUID) -> dict:
    """Send one daily batch for the given campaign.

    Selects up to `batch_size` segment users who don't yet have an `update_email_sends`
    row for this campaign (oldest signups first), mails each, and records the result
    immediately — so a crash mid-batch resumes cleanly on the next run. Marks the
    campaign "completed" once every segment user has been reached.
    """
    campaign = await db.get(UpdateEmail, email_id)
    if campaign is None or campaign.status not in ("scheduled", "running"):
        return {"sent": 0, "failed": 0}

    segment = _segment_query(campaign.user_filter)

    # Snapshot the segment size and flip to "running" on the first batch.
    if campaign.status == "scheduled":
        total = await db.execute(
            select(func.count()).select_from(segment.subquery())
        )
        campaign.total_users = total.scalar_one()
        campaign.status = "running"
        await db.commit()

    already_sent = select(UpdateEmailSend.user_id).where(
        UpdateEmailSend.update_email_id == email_id
    )
    remaining = await db.execute(
        segment.where(User.id.notin_(already_sent))
        .order_by(User.created_at.asc())
        .limit(campaign.batch_size)
    )
    batch = remaining.all()

    if not batch:
        campaign.status = "completed"
        campaign.updated_at = datetime.now(timezone.utc)
        await db.commit()
        logger.info("Update email %s completed — all subscribers reached", email_id)
        return {"sent": 0, "failed": 0}

    logger.info("Update email %s: sending batch of %d", email_id, len(batch))

    sent = failed = 0
    for i, (user_id, to_email, name) in enumerate(batch):
        if i > 0:
            await asyncio.sleep(SEND_PACE_SECONDS)
        token = create_unsubscribe_token(user_id)
        ok = await send_update_email(
            to_email=to_email,
            name=name or "",
            subject=campaign.subject,
            body=campaign.body,
            unsubscribe_token=token,
        )
        send_status = "sent" if ok else "failed"
        if ok:
            campaign.sent_count += 1
            sent += 1
        else:
            campaign.failed_count += 1
            failed += 1

        # Recorded and committed right after this one send, not batched — so a crash on
        # the next line still leaves this recipient durably marked as reached.
        # ON CONFLICT DO NOTHING so a rerun (or a second instance) resolves to one row
        # instead of an IntegrityError aborting the batch.
        await db.execute(
            pg_insert(UpdateEmailSend)
            .values(update_email_id=email_id, user_id=user_id, status=send_status)
            .on_conflict_do_nothing(index_elements=["update_email_id", "user_id"])
        )
        campaign.updated_at = datetime.now(timezone.utc)
        await db.commit()

    # Complete if every current segment user now has a send row.
    total_sent = await db.execute(
        select(func.count(UpdateEmailSend.id)).where(
            UpdateEmailSend.update_email_id == email_id
        )
    )
    total_eligible = await db.execute(
        select(func.count()).select_from(_segment_query(campaign.user_filter).subquery())
    )
    if total_sent.scalar_one() >= total_eligible.scalar_one():
        campaign.status = "completed"
        campaign.updated_at = datetime.now(timezone.utc)
        await db.commit()
        logger.info("Update email %s completed after this batch", email_id)

    return {"sent": sent, "failed": failed}


async def run_due_update_emails(db: AsyncSession) -> dict:
    """Hourly gate: run today's batch for any campaign whose send hour is now.

    Called by the scheduler every hour. For each active campaign, if the current UTC
    hour matches its send hour and no send has been recorded for it since today's UTC
    midnight, run one batch. The "sent anything today?" check lives in the DB (not an
    in-memory dict), so it survives restarts: a redeploy during the send window won't
    fire a second batch.
    """
    now = datetime.now(timezone.utc)
    today_midnight = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)

    result = await db.execute(
        select(UpdateEmail)
        .where(UpdateEmail.status.in_(("scheduled", "running")))
        .order_by(UpdateEmail.created_at.asc())
    )
    campaigns = result.scalars().all()

    batches_run = 0
    for campaign in campaigns:
        if now.hour != _effective_send_hour(campaign):
            continue

        ran_today = await db.execute(
            select(UpdateEmailSend.id)
            .where(
                UpdateEmailSend.update_email_id == campaign.id,
                UpdateEmailSend.sent_at >= today_midnight,
            )
            .limit(1)
        )
        if ran_today.first() is not None:
            continue

        await run_update_email_batch(db, campaign.id)
        batches_run += 1

    return {"batches_run": batches_run}
