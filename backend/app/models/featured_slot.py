import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Editorial review of a paid booking. Paying reserves the dates but does not put the
# publication on the site: only an approved booking is ever activated.
APPROVAL_STATUSES = ("pending", "approved", "rejected")


class FeaturedSlot(Base):
    """A paid booking of the site-wide "featured publication" slot.

    One row per purchase attempt. `start_date`/`end_date` are inclusive calendar
    days (no time component), so two bookings overlap iff
    `a.start <= b.end AND a.end >= b.start`.

    Lifecycle: a row is created as `pending` with a `hold_expires_at` 30 minutes
    out, which reserves the dates while the buyer is on Stripe's checkout page.
    The Stripe webhook flips it to `paid`. The reconcile job (cron, every 5h) is
    the *only* writer of `is_active`: it expires lapsed holds and finished
    bookings and activates the paid booking covering today. A partial unique
    index on `is_active` guarantees at most one active row at any time.
    """

    __tablename__ = "featured_slots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publication_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("publications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False, server_default="7")
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="pending", index=True
    )  # pending | paid | expired | cancelled
    # Editorial review, independent of payment: a booking can be paid but unapproved.
    # Rejection releases the dates by moving `status` to "cancelled" — the calendar
    # blocks on `status`, never on this column.
    approval_status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="pending", index=True
    )  # pending | approved | rejected
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false", index=True
    )
    hold_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stripe_session_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True, index=True
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, server_default="usd")
    # Clicks on the featured *card* (home page / dashboard) during this run — i.e. the
    # readers the placement itself sent to the publication. Detail-page outbound links
    # are not counted: those clicks would have happened anyway, and folding them in
    # would stop this meaning "what the slot earned me".
    #
    # Counted per booking rather than per publication, so a publication featured twice
    # gets a separate figure for each run.
    click_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    # Unique visitors who actually saw the featured card during this run. Backed by
    # FeaturedSlotImpression rows so repeats from the same viewer remain idempotent.
    impression_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    publication: Mapped["Publication"] = relationship("Publication")  # noqa: F821
    user: Mapped["User"] = relationship("User")  # noqa: F821


class FeaturedSlotImpression(Base):
    """One identity that has seen a featured slot.

    A viewer can have both a browser identity and a signed-in user identity. The
    unique constraint keeps each identity idempotent per booking; helper logic ties
    the two together so logging in after a guest view does not increment twice.
    """

    __tablename__ = "featured_slot_impressions"
    __table_args__ = (
        UniqueConstraint("slot_id", "identity_type", "identity_hash", name="uq_featured_impression_identity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("featured_slots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    identity_type: Mapped[str] = mapped_column(String(16), nullable=False)
    identity_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    slot: Mapped["FeaturedSlot"] = relationship("FeaturedSlot")  # noqa: F821
    user: Mapped["User | None"] = relationship("User")  # noqa: F821
