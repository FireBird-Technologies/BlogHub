"""add image_position / avatar_position for user-adjustable crops

Owners can choose the CSS object-position (e.g. "50% 30%") used when their
publication image or avatar is cropped into card/row/avatar thumbnails. Both
columns are nullable; null means the browser default (center), so existing rows
render exactly as before.

Revision ID: 0027
Revises: 0026
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0027"
down_revision: Union[str, None] = "0026"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "publications",
        sa.Column("image_position", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("avatar_position", sa.String(length=32), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_position")
    op.drop_column("publications", "image_position")
