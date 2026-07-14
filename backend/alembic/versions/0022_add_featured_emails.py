"""add featured_emails (marketing email for a featured publication)

Revision ID: 0022
Revises: 0021
Create Date: 2026-07-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0022"
down_revision: Union[str, None] = "0021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "featured_emails",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "slot_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("featured_slots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "publication_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("publications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("author_approved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("admin_approved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("status", sa.String(length=16), server_default="draft", nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("recipient_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    # One draft per booking — this is what makes draft creation idempotent.
    op.create_index("ix_featured_emails_slot_id", "featured_emails", ["slot_id"], unique=True)
    op.create_index("ix_featured_emails_status", "featured_emails", ["status"])
    op.create_index("ix_featured_emails_created_at", "featured_emails", ["created_at"])


def downgrade() -> None:
    op.drop_table("featured_emails")
