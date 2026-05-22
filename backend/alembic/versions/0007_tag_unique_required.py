"""make user tag unique and required

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-21 00:00:00.000000

"""
import random
import re
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _slug(name: str) -> str:
    """Reduce a display name to a lowercase alphanumeric tag base."""
    slug = re.sub(r"[^a-z0-9]", "", (name or "").lower())
    return slug[:24] or "user"


def upgrade() -> None:
    conn = op.get_bind()

    # Backfill a generated tag for every user that doesn't have one yet.
    used = {
        row[0]
        for row in conn.execute(sa.text("SELECT tag FROM users WHERE tag IS NOT NULL")).fetchall()
    }
    rows = conn.execute(sa.text("SELECT id, name FROM users WHERE tag IS NULL")).fetchall()
    for user_id, name in rows:
        base = _slug(name)
        candidate = f"{base}{random.randint(1000, 9999)}"
        while candidate in used:
            candidate = f"{base}{random.randint(1000, 9999)}"
        used.add(candidate)
        conn.execute(
            sa.text("UPDATE users SET tag = :tag WHERE id = :id"),
            {"tag": candidate, "id": user_id},
        )

    op.alter_column("users", "tag", existing_type=sa.String(length=64), nullable=False)
    op.create_unique_constraint("uq_users_tag", "users", ["tag"])


def downgrade() -> None:
    op.drop_constraint("uq_users_tag", "users", type_="unique")
    op.alter_column("users", "tag", existing_type=sa.String(length=64), nullable=True)
