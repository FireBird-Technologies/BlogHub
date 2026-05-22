"""add user website and onboarded fields

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("website", sa.Text(), nullable=True))
    op.add_column(
        "users",
        sa.Column("onboarded", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    # Existing users are treated as already onboarded so they don't see the modal.
    op.execute("UPDATE users SET onboarded = true")


def downgrade() -> None:
    op.drop_column("users", "onboarded")
    op.drop_column("users", "website")
