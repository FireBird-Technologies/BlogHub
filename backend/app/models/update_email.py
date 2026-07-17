import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

UPDATE_EMAIL_STATUSES = ("scheduled", "running", "completed")


class UpdateEmail(Base):
    """A product-update email campaign, sent one daily batch at a time.

    There is no UI, API, or CLI: an admin inserts a row via raw SQL. A background job
    (see app/helpers/update_email.py, driven by the scheduler) wakes every hour; when
    the current UTC hour matches this campaign's `send_hour`, it sends one batch of
    `batch_size` subscribers who haven't received it yet, recording each delivery in
    `update_email_sends`. So a 5,000-user list at batch_size=50 rolls out over ~100
    days, one batch per day — raise `batch_size` to go faster.

    The send is crash/redeploy-resumable: recipients are excluded via an anti-join
    against `update_email_sends`, so a batch that dies partway never re-sends to anyone
    already recorded. `status` walks scheduled -> running -> completed; only rows in
    scheduled/running are picked up.
    """

    __tablename__ = "update_emails"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    # Plain text, rendered to HTML at send time.
    body: Mapped[str] = mapped_column(Text, nullable=False)
    # Segment. Only "all" (every subscribed user) is implemented; the column exists so
    # future segments can be added without a migration. BlogHub has no plan/tier concept.
    user_filter: Mapped[str] = mapped_column(String(20), nullable=False, server_default="all")
    # Subscribers sent per daily batch.
    batch_size: Mapped[int] = mapped_column(Integer, nullable=False, server_default="50")
    # UTC hour (0-23) the daily batch runs; -1 means use settings.UPDATE_EMAIL_SEND_HOUR.
    send_hour: Mapped[int] = mapped_column(Integer, nullable=False, server_default="-1")
    # Segment size, snapshotted on the first run (scheduled -> running).
    total_users: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    sent_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="scheduled", index=True
    )  # scheduled | running | completed
    # Also the scheduler's ordering key (oldest campaign first).
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
