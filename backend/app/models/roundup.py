import uuid
from datetime import date, datetime, timezone

from sqlalchemy import String, DateTime, Date, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FeaturedRoundup(Base):
    """A weekly 'Top N [category] blogs' roundup page.

    One row per (category, week_start). `publication_ids` is an ordered list of
    publication UUID strings; the render endpoint hydrates them live so the page
    reflects later edits/deletes. Generation is idempotent via the unique
    constraint below.
    """

    __tablename__ = "featured_roundups"
    __table_args__ = (UniqueConstraint("category", "week_start", name="uq_roundup_category_week"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    week_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    publication_ids: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
