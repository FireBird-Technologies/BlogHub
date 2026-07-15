"""add unique impression tracking for featured slots

Revision ID: 0029
Revises: 0028
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0029"
down_revision: Union[str, None] = "0028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "featured_slots",
        sa.Column("impression_count", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_table(
        "featured_slot_impressions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slot_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("identity_type", sa.String(length=16), nullable=False),
        sa.Column("identity_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["slot_id"], ["featured_slots.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "slot_id",
            "identity_type",
            "identity_hash",
            name="uq_featured_impression_identity",
        ),
    )
    op.create_index(
        op.f("ix_featured_slot_impressions_slot_id"),
        "featured_slot_impressions",
        ["slot_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_featured_slot_impressions_user_id"),
        "featured_slot_impressions",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_featured_slot_impressions_created_at"),
        "featured_slot_impressions",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_featured_slot_impressions_created_at"), table_name="featured_slot_impressions")
    op.drop_index(op.f("ix_featured_slot_impressions_user_id"), table_name="featured_slot_impressions")
    op.drop_index(op.f("ix_featured_slot_impressions_slot_id"), table_name="featured_slot_impressions")
    op.drop_table("featured_slot_impressions")
    op.drop_column("featured_slots", "impression_count")
