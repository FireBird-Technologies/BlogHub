"""add publication_claims table

Revision ID: 0010
Revises: 0009
Create Date: 2026-06-03 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "publication_claims",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "publication_id",
            UUID(as_uuid=True),
            sa.ForeignKey("publications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("claimer_name", sa.String(length=256), nullable=False),
        sa.Column("claimer_email", sa.String(length=256), nullable=False),
        sa.Column("social_links", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("original_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("publication_id", "user_id", name="uq_claim_user_pub"),
    )
    op.create_index(
        "ix_publication_claims_publication_id", "publication_claims", ["publication_id"]
    )
    op.create_index("ix_publication_claims_user_id", "publication_claims", ["user_id"])
    op.create_index("ix_publication_claims_status", "publication_claims", ["status"])


def downgrade() -> None:
    op.drop_index("ix_publication_claims_status", table_name="publication_claims")
    op.drop_index("ix_publication_claims_user_id", table_name="publication_claims")
    op.drop_index("ix_publication_claims_publication_id", table_name="publication_claims")
    op.drop_table("publication_claims")
