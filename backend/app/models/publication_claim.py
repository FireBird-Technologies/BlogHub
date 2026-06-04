import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

CLAIM_STATUSES = ("pending", "verified", "rejected")


class PublicationClaim(Base):
    __tablename__ = "publication_claims"
    __table_args__ = (
        UniqueConstraint("publication_id", "user_id", name="uq_claim_user_pub"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publication_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("publications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    claimer_name: Mapped[str] = mapped_column(String(256), nullable=False)
    claimer_email: Mapped[str] = mapped_column(String(256), nullable=False)
    social_links: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    original_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="pending", server_default="pending", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    publication: Mapped["Publication"] = relationship("Publication")  # noqa: F821
    user: Mapped["User"] = relationship("User")  # noqa: F821
