"""add button_text to featured_emails

The publication link is rendered as a single button rather than a linked title, and
the author now chooses the button's label in the announcement step (e.g. "Read the
article", "Visit the site"). Falls back to a generic label for rows drafted before
this existed.

Revision ID: 0024
Revises: 0023
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0024"
down_revision: Union[str, None] = "0023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "featured_emails",
        sa.Column("button_text", sa.String(length=60), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("featured_emails", "button_text")
