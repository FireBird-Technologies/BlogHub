import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.helpers.featured import handle_checkout_completed
from app.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["stripe"])


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Stripe's payment callback. The signature is the authentication — no JWT here.

    Returns 2xx for everything except a bad signature: any other non-2xx makes
    Stripe retry the event for days.
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.warning("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook not configured"
        )

    # The raw bytes, exactly as Stripe sent them — request.json() would re-serialize
    # and break the signature check.
    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.SignatureVerificationError) as exc:
        logger.warning("Rejected Stripe webhook with a bad signature: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature"
        ) from exc

    if event["type"] == "checkout.session.completed":
        try:
            await handle_checkout_completed(db, event["data"]["object"])
        except Exception as exc:  # noqa: BLE001
            # Swallow and 200: Stripe would otherwise retry for days, and the
            # reconcile cron will pick up anything we failed to finish here.
            logger.exception("Failed to process Stripe checkout.session.completed: %s", exc)

    return {"received": True}
