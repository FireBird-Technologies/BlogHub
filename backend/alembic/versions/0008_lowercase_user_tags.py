"""lowercase all user tags

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tags are case-insensitive: store them lowercase so the unique
    # constraint treats "Changezi" and "changezi" as the same handle.
    # If two tags collide once lowercased, keep the one already lowercase
    # and append a number to the other to preserve uniqueness.
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, tag FROM users")).fetchall()

    used: set[str] = set()
    pending: list[tuple[object, str]] = []
    for user_id, tag in rows:
        low = (tag or "").lower()
        if tag == low:
            used.add(low)  # already lowercase — reserve as-is
        else:
            pending.append((user_id, low))

    for user_id, low in pending:
        candidate = low
        suffix = 2
        while candidate in used:
            candidate = f"{low}{suffix}"
            suffix += 1
        used.add(candidate)
        conn.execute(
            sa.text("UPDATE users SET tag = :tag WHERE id = :id"),
            {"tag": candidate, "id": user_id},
        )


def downgrade() -> None:
    # Original casing cannot be recovered; nothing to undo.
    pass
