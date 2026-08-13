"""In-process background scheduler, started and stopped by the FastAPI lifespan.

Runs the featured-slot reconciliation every 5 hours: release lapsed unpaid holds,
retire finished bookings, and activate the booking covering today.

Note this runs once *per application instance*. That is safe — reconcile takes a
Postgres advisory lock and is idempotent, so concurrent runs cannot corrupt state —
but if the backend is ever scaled beyond one container, each will run its own timer.
The interval also restarts on deploy, so a redeploy cadence faster than the interval
would starve the job; the endpoint stays available for a manual/external trigger.
"""

import asyncio
import logging

from app.database import AsyncSessionLocal
from app.helpers.featured import reconcile_slots
from app.helpers.featured_email import send_due_emails
from app.helpers.featured_reminder import send_expiry_reminders
from app.helpers.update_email import run_due_update_emails

logger = logging.getLogger(__name__)

# Every hour. Authors pick the exact hour their announcement goes out, so the tick has
# to be at least that fine or the picker would be lying to them. The work is idempotent
# and cheap (a couple of indexed queries when there's nothing to do), so running it more
# often costs essentially nothing.
RECONCILE_INTERVAL_SECONDS = 60 * 60

# Wait before the first run so startup (and the Alembic migration in the entrypoint)
# has settled before we touch the database.
INITIAL_DELAY_SECONDS = 60


async def _reconcile_once() -> None:
    """One tick: reconcile the slots, send any featured marketing email that is due,
    run any product-update campaign batch that is due, then remind the authors whose
    featured run ends today.

    The four are independent, so each gets its own try/except — a failure in one must
    not stop the others from running.

    Note the send is only as punctual as the tick: an email scheduled for T+24h
    actually goes out somewhere in [T+24h, T+29h). That is fine for a marketing blast
    and saves running a second timer.
    """
    async with AsyncSessionLocal() as db:
        try:
            result = await reconcile_slots(db)
            logger.info(
                "Featured slots reconciled: %s holds released, %s deactivated, %s activated",
                result.holds_released,
                result.deactivated,
                result.activated,
            )
        except Exception:  # noqa: BLE001
            logger.exception("Featured slot reconciliation failed")

        try:
            sent = await send_due_emails(db)
            if sent["emails_sent"]:
                logger.info(
                    "Featured marketing: %s email(s) sent to %s recipients",
                    sent["emails_sent"],
                    sent["recipients"],
                )
        except Exception:  # noqa: BLE001
            logger.exception("Featured marketing email send failed")

        try:
            due = await run_due_update_emails(db)
            if due["batches_run"]:
                logger.info("Update emails: %s campaign batch(es) run", due["batches_run"])
        except Exception:  # noqa: BLE001
            logger.exception("Update email batch send failed")

        try:
            reminders = await send_expiry_reminders(db)
            if reminders["reminders_sent"]:
                logger.info(
                    "Featured expiry reminders: %s author(s) notified", reminders["reminders_sent"]
                )
        except Exception:  # noqa: BLE001
            logger.exception("Featured expiry reminder send failed")


async def _reconcile_loop() -> None:
    await asyncio.sleep(INITIAL_DELAY_SECONDS)
    while True:
        try:
            await _reconcile_once()
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            # Never let a transient failure (e.g. a dropped DB connection) kill the
            # loop — log it and try again at the next tick.
            logger.exception("Featured slot reconciliation failed; retrying next cycle")
        await asyncio.sleep(RECONCILE_INTERVAL_SECONDS)


def start_scheduler() -> asyncio.Task:
    logger.info("Starting featured-slot scheduler (every %sh)", RECONCILE_INTERVAL_SECONDS // 3600)
    return asyncio.create_task(_reconcile_loop())


async def stop_scheduler(task: asyncio.Task) -> None:
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
