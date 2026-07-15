"""add featured_slots (paid featured publication bookings)

Revision ID: 0019
Revises: 0018
Create Date: 2026-07-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0019"
down_revision: Union[str, None] = "0018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "featured_slots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "publication_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("publications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("duration_days", sa.Integer(), server_default="7", nullable=False),
        sa.Column("status", sa.String(length=16), server_default="pending", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("hold_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("stripe_session_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(length=255), nullable=True),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), server_default="usd", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_featured_slots_publication_id", "featured_slots", ["publication_id"])
    op.create_index("ix_featured_slots_user_id", "featured_slots", ["user_id"])
    op.create_index("ix_featured_slots_start_date", "featured_slots", ["start_date"])
    op.create_index("ix_featured_slots_end_date", "featured_slots", ["end_date"])
    op.create_index("ix_featured_slots_status", "featured_slots", ["status"])
    op.create_index("ix_featured_slots_is_active", "featured_slots", ["is_active"])
    op.create_index("ix_featured_slots_created_at", "featured_slots", ["created_at"])
    op.create_index(
        "ix_featured_slots_stripe_session_id", "featured_slots", ["stripe_session_id"], unique=True
    )
    # At most one featured publication may be active at any time.
    op.create_index(
        "ix_featured_slots_one_active",
        "featured_slots",
        ["is_active"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )


def downgrade() -> None:
    op.drop_table("featured_slots")
