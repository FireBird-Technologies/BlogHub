"""add featured_roundups table

Revision ID: 0017
Revises: 0016
Create Date: 2026-06-18 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0017"
down_revision: Union[str, None] = "0016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "featured_roundups",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("publication_ids", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("category", "week_start", name="uq_roundup_category_week"),
    )
    op.create_index(op.f("ix_featured_roundups_slug"), "featured_roundups", ["slug"], unique=True)
    op.create_index(op.f("ix_featured_roundups_category"), "featured_roundups", ["category"], unique=False)
    op.create_index(op.f("ix_featured_roundups_week_start"), "featured_roundups", ["week_start"], unique=False)
    op.create_index(op.f("ix_featured_roundups_created_at"), "featured_roundups", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_featured_roundups_created_at"), table_name="featured_roundups")
    op.drop_index(op.f("ix_featured_roundups_week_start"), table_name="featured_roundups")
    op.drop_index(op.f("ix_featured_roundups_category"), table_name="featured_roundups")
    op.drop_index(op.f("ix_featured_roundups_slug"), table_name="featured_roundups")
    op.drop_table("featured_roundups")
