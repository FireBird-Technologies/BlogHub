"""add author_timezone to featured_emails

The author now picks when their announcement is sent. `scheduled_at` already stores a
true UTC instant; this records the IANA zone they chose it in, so we can show the time
back to them exactly as they entered it.

Revision ID: 0023
Revises: 0022
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0023"
down_revision: Union[str, None] = "0022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "featured_emails",
        sa.Column("author_timezone", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("featured_emails", "author_timezone")
