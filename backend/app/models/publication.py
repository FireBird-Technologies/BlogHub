import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, String, Text, Integer, DateTime, ForeignKey, JSON
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
    "Philosophy",
    "Economics",
    "History",
    "Biology",
    "Life Sciences",
    "Physics",
    "Maths",
    "Chemistry",
    "Self Improvement",
    "News",
]


def normalize_category(value: str) -> str:
    """Canonicalize a category for storage.

    Matches a builtin case-insensitively (returning its canonical spelling), else
    title-cases each word so casing/whitespace variants of a custom category
    collapse to one value (e.g. "data  science" / "DATA SCIENCE" -> "Data Science").
    Raises ValueError if empty or too long.
    """
    s = value.strip()
    if not s:
        raise ValueError("category is required")
    if len(s) > 64:
        raise ValueError("category must be 64 characters or fewer")
    for cat in CATEGORIES:
        if cat.lower() == s.lower():
            return cat
    return " ".join(w[0].upper() + w[1:].lower() for w in s.split())


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    tags: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    additional_links: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    social_links: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    upvote_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    # Created from an arbitrary URL for a paid featured slot rather than a normal
    # submission — real, queryable Publication row (so the whole featured pipeline
    # works unchanged), just excluded from public browsing: home feed, search,
    # categories, tags, roundups, and other users' view of the owner's profile.
    # Still visible to its own owner (e.g. their own publications list).
    is_unlisted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false", index=True
    )
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
