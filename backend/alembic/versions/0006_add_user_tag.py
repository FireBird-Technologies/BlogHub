"""add user tag, drop user bio

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("tag", sa.String(length=64), nullable=True))
    op.drop_column("users", "bio")


def downgrade() -> None:
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.drop_column("users", "tag")
