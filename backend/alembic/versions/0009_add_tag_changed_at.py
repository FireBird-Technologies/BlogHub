"""add tag_changed_at to users

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-22 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tracks when a user last changed their tag after onboarding.
    # NULL means the post-onboarding free change is still available; once set,
    # it anchors the 14-day cooldown before the next change is allowed.
    op.add_column(
        "users",
        sa.Column("tag_changed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "tag_changed_at")
