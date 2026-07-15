import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    tag: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    # CSS object-position (e.g. "50% 30%") for how avatar_url is cropped. Null = center.
    avatar_position: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # Zoom factor for the avatar crop (1.0 = fit, higher = zoomed in). Null = 1.
    avatar_scale: Mapped[float | None] = mapped_column(Float, nullable=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    onboarded: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    subscribed_only: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    tag_changed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    publications: Mapped[list["Publication"]] = relationship(  # noqa: F821
        "Publication", back_populates="author", cascade="all, delete-orphan"
    )
    upvotes: Mapped[list["Upvote"]] = relationship(  # noqa: F821
        "Upvote", back_populates="user", cascade="all, delete-orphan"
    )
