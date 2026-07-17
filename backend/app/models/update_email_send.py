import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UpdateEmailSend(Base):
    """One row per subscriber who has received (or failed to receive) an update email.

    This is what makes the batch resumable and dedup-safe: before sending, the batch
    loop excludes anyone who already has a row for (campaign, user), and inserts one
    (committed immediately) right after each send. The unique constraint guarantees a
    crash or a redeploy mid-batch can never double-send.
    """

    __tablename__ = "update_email_sends"
    __table_args__ = (
        UniqueConstraint(
            "update_email_id", "user_id", name="uq_update_email_sends_email_user"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    update_email_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("update_emails.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # "sent" | "failed"
    status: Mapped[str] = mapped_column(String(10), nullable=False, server_default="sent")
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
