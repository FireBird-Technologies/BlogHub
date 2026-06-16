"""fix Self Improvement category casing

"Self Improvement" was missing from the backend CATEGORIES list, so submissions
fell through the category validator and were stored as "Self improvement"
(lowercase i). That value never matched the "Self Improvement" ranking page and
leaked into the "Others" (custom) bucket instead. Re-canonicalize any such rows.

Revision ID: 0015
Revises: 0014
Create Date: 2026-06-16 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0015"
down_revision: Union[str, None] = "0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE publications SET category = 'Self Improvement' "
            "WHERE lower(category) = 'self improvement' AND category <> 'Self Improvement'"
        )
    )


def downgrade() -> None:
    # Original (mis-cased) values cannot be reliably recovered; nothing to undo.
    pass
