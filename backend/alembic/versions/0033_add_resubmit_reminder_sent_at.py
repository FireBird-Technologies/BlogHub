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
    op.add_column(
        "publications",
        sa.Column("resubmit_reminder_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Backfill every existing row as already-reminded. The reminder is for
    # publications submitted from here on: without this, the whole back catalogue is
    # "due" the moment this ships and every existing author gets a nudge about a
    # listing they may have submitted years ago. Stamping now excludes them
    # permanently — the job only ever picks up rows created after this migration.
    op.execute("UPDATE publications SET resubmit_reminder_sent_at = NOW()")


def downgrade() -> None:
    op.drop_column("publications", "resubmit_reminder_sent_at")
