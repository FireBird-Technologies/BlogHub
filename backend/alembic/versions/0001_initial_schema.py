"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("google_id", sa.String(length=128), nullable=False),
        sa.Column("email", sa.String(length=256), nullable=False),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("google_id"),
    )
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    # -------------------------------------------------------------- publications
    op.create_table(
        "publications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("tags", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("upvote_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_publications_user_id", "publications", ["user_id"])
    op.create_index("ix_publications_category", "publications", ["category"])
    op.create_index("ix_publications_created_at", "publications", ["created_at"])

    # ----------------------------------------------------------------- upvotes
    op.create_table(
        "upvotes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("publication_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["publication_id"], ["publications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "publication_id", name="uq_upvote_user_pub"),
    )
    op.create_index("ix_upvotes_user_id", "upvotes", ["user_id"])
    op.create_index("ix_upvotes_publication_id", "upvotes", ["publication_id"])


def downgrade() -> None:
    op.drop_table("upvotes")
    op.drop_table("publications")
    op.drop_table("users")
