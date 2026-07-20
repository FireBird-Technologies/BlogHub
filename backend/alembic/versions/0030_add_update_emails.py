"""add update email campaigns

Revision ID: 0030
Revises: 0029
Create Date: 2026-07-17 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0030"
down_revision: Union[str, None] = "0029"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "update_emails",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject", sa.String(length=500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("user_filter", sa.String(length=20), server_default="all", nullable=False),
        sa.Column("batch_size", sa.Integer(), server_default="50", nullable=False),
        sa.Column("send_hour", sa.Integer(), server_default="-1", nullable=False),
        sa.Column("total_users", sa.Integer(), server_default="0", nullable=False),
        sa.Column("sent_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("failed_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="scheduled", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_update_emails_status"), "update_emails", ["status"], unique=False
    )
    op.create_table(
        "update_email_sends",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("update_email_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=10), server_default="sent", nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["update_email_id"], ["update_emails.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "update_email_id", "user_id", name="uq_update_email_sends_email_user"
        ),
    )
    op.create_index(
        op.f("ix_update_email_sends_update_email_id"),
        "update_email_sends",
        ["update_email_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_update_email_sends_user_id"),
        "update_email_sends",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_update_email_sends_user_id"), table_name="update_email_sends")
    op.drop_index(
        op.f("ix_update_email_sends_update_email_id"), table_name="update_email_sends"
    )
    op.drop_table("update_email_sends")
    op.drop_index(op.f("ix_update_emails_status"), table_name="update_emails")
    op.drop_table("update_emails")
