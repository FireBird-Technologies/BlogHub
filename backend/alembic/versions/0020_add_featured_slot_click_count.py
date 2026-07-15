"""add click_count to featured_slots

Counts outbound clicks from BlogHub to the featured publication's own links during
its run — the traffic the buyer actually paid for.

Revision ID: 0020
Revises: 0019
Create Date: 2026-07-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0020"
down_revision: Union[str, None] = "0019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "featured_slots",
        sa.Column("click_count", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("featured_slots", "click_count")
