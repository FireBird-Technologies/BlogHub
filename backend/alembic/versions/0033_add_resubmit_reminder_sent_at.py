"""add resubmit_reminder_sent_at to publications

Revision ID: 0033
Revises: 0032
Create Date: 2026-08-18 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0033"
down_revision: Union[str, None] = "0032"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Nullable, no backfill — but note every publication older than four weeks is
    # already "due" the moment this ships, so the reminder job caps how many it will
    # send per tick rather than mailing the whole back catalogue at once.
    op.add_column(
        "publications",
        sa.Column("resubmit_reminder_sent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("publications", "resubmit_reminder_sent_at")
