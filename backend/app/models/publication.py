import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

CATEGORIES = [
    "Tech",
    "Design",
    "Science",
    "Business",
    "Culture",
    "Health",
    "Education",
    "Finance",
    "Entertainment",
    "Fashion",
    "Politics",
]


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    tags: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    additional_links: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    social_links: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    upvote_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    author: Mapped["User"] = relationship("User", back_populates="publications")  # noqa: F821
    upvotes: Mapped[list["Upvote"]] = relationship(  # noqa: F821
        "Upvote", back_populates="publication", cascade="all, delete-orphan"
    )
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="publication", cascade="all, delete-orphan"
    )
