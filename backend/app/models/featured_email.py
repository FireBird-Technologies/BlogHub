import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

EMAIL_STATUSES = ("draft", "scheduled", "sent", "cancelled")


class FeaturedEmail(Base):
    """The marketing email announcing a featured publication to subscribers.

    One row per featured booking (`slot_id` is unique, which is also what makes
    draft creation idempotent). It is drafted from the publication's own content when
    the admin approves the booking, and needs *two* approvals before it will send:
    the author's (they are the one being represented) and the admin's. Once both are
    in, it is scheduled for 24 hours after the run *goes live* — not 24 hours after
    approval, so a booking made for next month is not announced today — and the
    scheduler then posts it to every subscribed user.
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
    author_approved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    admin_approved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="draft", index=True
    )  # draft | scheduled | sent | cancelled
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recipient_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    slot: Mapped["FeaturedSlot"] = relationship("FeaturedSlot")  # noqa: F821
    publication: Mapped["Publication"] = relationship("Publication")  # noqa: F821
