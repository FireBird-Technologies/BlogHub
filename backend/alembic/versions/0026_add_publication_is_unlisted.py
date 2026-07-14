"""add is_unlisted to publications

Backs the "feature any link" flow: a publication created from an arbitrary URL
(rather than a normal submission) to fill a paid featured slot. It's a real,
queryable Publication row — same table, same pipeline — just excluded from public
browsing (home feed, search, categories, tags, roundups, other users' view of the
owner's profile) via this flag. The owner can still see their own.

Revision ID: 0026
Revises: 0025
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0026"
down_revision: Union[str, None] = "0025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "publications",
        sa.Column("is_unlisted", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("ix_publications_is_unlisted", "publications", ["is_unlisted"])


def downgrade() -> None:
    op.drop_index("ix_publications_is_unlisted", table_name="publications")
    op.drop_column("publications", "is_unlisted")
