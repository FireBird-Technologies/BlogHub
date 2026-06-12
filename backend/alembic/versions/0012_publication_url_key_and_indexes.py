"""publication url_key dedup and read indexes

Revision ID: 0012
Revises: 0011
Create Date: 2026-06-11 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize_host(url: str) -> str:
    from urllib.parse import urlparse

    raw = (url or "").strip()
    if not raw:
        return ""
    if "://" not in raw:
        raw = f"https://{raw}"
    try:
        parsed = urlparse(raw)
        host = (parsed.hostname or "").lower()
        if host.startswith("www."):
            host = host[4:]
        return host
    except Exception:
        return raw.lower()


def upgrade() -> None:
    op.add_column("publications", sa.Column("url_key", sa.String(length=256), nullable=True))

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, url FROM publications")).fetchall()
    seen: dict[str, str] = {}
    for row_id, url in rows:
        key = _normalize_host(url)
        if not key:
            key = f"unknown-{row_id}"
        if key in seen:
            key = f"{key}-{row_id}"
        seen[key] = str(row_id)
        conn.execute(
            sa.text("UPDATE publications SET url_key = :key WHERE id = :id"),
            {"key": key, "id": row_id},
        )

    op.alter_column("publications", "url_key", nullable=False)
    op.create_index("ix_publications_url_key", "publications", ["url_key"], unique=True)
    op.create_index(
        "ix_publications_category_created_id",
        "publications",
        ["category", "created_at", "id"],
        unique=False,
    )
    op.create_index(
        "ix_publications_created_id",
        "publications",
        ["created_at", "id"],
        unique=False,
    )
    op.create_index("ix_publications_upvote_count", "publications", ["upvote_count"], unique=False)
    op.execute(
        "CREATE INDEX ix_publications_tags_gin ON publications USING GIN ((tags::jsonb))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_publications_tags_gin")
    op.drop_index("ix_publications_upvote_count", table_name="publications")
    op.drop_index("ix_publications_created_id", table_name="publications")
    op.drop_index("ix_publications_category_created_id", table_name="publications")
    op.drop_index("ix_publications_url_key", table_name="publications")
    op.drop_column("publications", "url_key")
