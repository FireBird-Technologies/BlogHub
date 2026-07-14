import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

EMAIL_STATUSES = ("draft", "scheduled", "sending", "sent", "cancelled")


class FeaturedEmail(Base):
    """The marketing email announcing a featured publication to subscribers.

    One row per featured booking (`slot_id` is unique, which is also what makes
    draft creation idempotent). It is drafted from the publication's own content when
    the admin approves the booking, and needs *two* approvals before it will send:
    the author's (they are the one being represented) and the admin's. Once both are
    in, it is scheduled for 24 hours after the run *goes live* — not 24 hours after
    approval, so a booking made for next month is not announced today — and the
    scheduler then posts it to every subscribed user.

    The send itself is resumable: each successful delivery is recorded as its own
    `FeaturedEmailRecipient` row, committed right after that recipient's email leaves.
    `status` only reaches "sent" once every subscriber as of that pass has one of
    those rows — a crash in the middle leaves it at "sending", and the next attempt
    (the scheduler's next tick, or the next time the server starts) resumes it,
    skipping everyone already recorded.
    """

    __tablename__ = "featured_emails"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("featured_slots.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    publication_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("publications.id", ondelete="CASCADE"), nullable=False
    )
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    # Plain text. Carries a `{name}` placeholder, substituted per recipient at send time.
    body: Mapped[str] = mapped_column(Text, nullable=False)
    # Label of the single button that links to the publication, e.g. "Read the
    # article". Chosen by the author in the announcement step. Nullable so older
    # rows (drafted before this existed) fall back to a generic label at send time.
    button_text: Mapped[str | None] = mapped_column(String(60), nullable=True)
    author_approved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    admin_approved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="draft", index=True
    )  # draft | scheduled | sending | sent | cancelled
    # "sending" covers the whole blast, from the moment it's claimed until every
    # subscriber as of that pass has a FeaturedEmailRecipient row. A crash mid-blast
    # leaves the row here, not at "sent" — the scheduler resumes it on the next tick
    # (or the next server start), sending only to whoever isn't recorded yet.
    # A genuine UTC instant: every subscriber receives the announcement at the same
    # moment. The author picks it in their own timezone and the browser converts.
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # The IANA zone the author chose that time in, e.g. "Asia/Karachi". Display only —
    # `scheduled_at` is what we send on. Stored so we can show them back the "9:00 PM"
    # they typed even if they later travel to another timezone.
    author_timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Set once, when status moves to "sent" — the final count of recipients reached.
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recipient_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    slot: Mapped["FeaturedSlot"] = relationship("FeaturedSlot")  # noqa: F821
    publication: Mapped["Publication"] = relationship("Publication")  # noqa: F821
