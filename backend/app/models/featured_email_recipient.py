import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FeaturedEmailRecipient(Base):
    """One row per subscriber who has actually received a featured announcement.

    This is what makes the send resumable: before mailing a subscriber, the send
    loop checks whether a row already exists for (email, user) and skips them if so.
    The row is inserted and committed immediately after that person's email leaves,
    not batched — so a crash mid-blast leaves an accurate record of exactly who was
    reached, and the next attempt (next scheduler tick, or the next server start)
    picks up with whoever is left.
    """

    __tablename__ = "featured_email_recipients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("featured_emails.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
