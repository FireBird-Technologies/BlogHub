"""add expiry_reminder_sent_at to featured_slots

Revision ID: 0031
Revises: 0030
Create Date: 2026-08-12 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0031"
down_revision: Union[str, None] = "0030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Nullable with no backfill: slots that already finished stay NULL, and the
    # reminder job only ever looks at rows whose end_date is today, so they are
    # never picked up retroactively.
    op.add_column(
        "featured_slots",
        sa.Column("expiry_reminder_sent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("featured_slots", "expiry_reminder_sent_at")
