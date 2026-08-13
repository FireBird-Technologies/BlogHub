import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PublicationInvite(Base):
    """One row per person invited to a publication by email.

    Records both sides: `sender_id`/`sender_email` is the BlogHub user who sent the
    invite, `recipient_email` is the address it went to. Kept even when the send
    itself fails (`status`), so the table is a record of what was attempted rather
    than only what succeeded.

    Recipients are not users — they are arbitrary addresses someone typed — so
    `recipient_email` is a plain string with no FK.
    """

    __tablename__ = "publication_invites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publication_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("publications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Denormalised copy of the sender's address at send time. The user row can change
    # its email later; this is what the invite actually went out under.
    sender_email: Mapped[str] = mapped_column(String(256), nullable=False)
    recipient_email: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    # sent | failed — a failed send is still recorded, so repeated failures to the
    # same address are visible rather than silently dropped.
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="sent")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )

    publication: Mapped["Publication"] = relationship("Publication")  # noqa: F821
    sender: Mapped["User"] = relationship("User")  # noqa: F821
