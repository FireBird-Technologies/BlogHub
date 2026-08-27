"""add publication_invites

Revision ID: 0032
Revises: 0031
Create Date: 2026-08-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0032"
down_revision: Union[str, None] = "0031"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "publication_invites",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("publication_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_email", sa.String(length=256), nullable=False),
        sa.Column("recipient_email", sa.String(length=256), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="sent", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["publications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_publication_invites_publication_id"),
        "publication_invites",
        ["publication_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_publication_invites_sender_id"), "publication_invites", ["sender_id"], unique=False
    )
    op.create_index(
        op.f("ix_publication_invites_recipient_email"),
        "publication_invites",
        ["recipient_email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_publication_invites_created_at"),
        "publication_invites",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_publication_invites_created_at"), table_name="publication_invites")
    op.drop_index(op.f("ix_publication_invites_recipient_email"), table_name="publication_invites")
    op.drop_index(op.f("ix_publication_invites_sender_id"), table_name="publication_invites")
    op.drop_index(op.f("ix_publication_invites_publication_id"), table_name="publication_invites")
    op.drop_table("publication_invites")
