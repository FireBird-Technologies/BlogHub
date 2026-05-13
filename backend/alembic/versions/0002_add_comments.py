"""add comments table

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("publication_id", UUID(as_uuid=True), sa.ForeignKey("publications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_comments_user_id", "comments", ["user_id"])
    op.create_index("ix_comments_publication_id", "comments", ["publication_id"])


def downgrade() -> None:
    op.drop_index("ix_comments_publication_id", table_name="comments")
    op.drop_index("ix_comments_user_id", table_name="comments")
    op.drop_table("comments")
