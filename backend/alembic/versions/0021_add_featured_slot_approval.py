"""add approval_status/approved_at to featured_slots

Paying reserves the dates but no longer puts the publication on the site: a booking
must be approved by an admin before the reconcile job will activate it.

Revision ID: 0021
Revises: 0020
Create Date: 2026-07-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0021"
down_revision: Union[str, None] = "0020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "featured_slots",
        sa.Column("approval_status", sa.String(length=16), server_default="pending", nullable=False),
    )
    op.add_column(
        "featured_slots",
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_featured_slots_approval_status", "featured_slots", ["approval_status"])

    # Any booking that predates this migration was live under the old "paying is
    # enough" rule — grandfather it in rather than silently un-featuring it.
    op.execute(
        "UPDATE featured_slots SET approval_status = 'approved', approved_at = now() "
        "WHERE status = 'paid'"
    )


def downgrade() -> None:
    op.drop_index("ix_featured_slots_approval_status", table_name="featured_slots")
    op.drop_column("featured_slots", "approved_at")
    op.drop_column("featured_slots", "approval_status")
