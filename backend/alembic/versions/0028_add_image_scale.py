"""add image_scale / avatar_scale for zoomable crops

Companion to 0027's position columns: a zoom factor (1.0 = fit, higher = zoomed in)
for the card/avatar thumbnail crop. Nullable; null means 1.0, so existing rows are
unaffected.

Revision ID: 0028
Revises: 0027
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0028"
down_revision: Union[str, None] = "0027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("publications", sa.Column("image_scale", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("avatar_scale", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_scale")
    op.drop_column("publications", "image_scale")
