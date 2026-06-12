"""normalize publication urls to base site; drop url_key

Revision ID: 0013
Revises: 0012
Create Date: 2026-06-11 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize_url(url: str) -> str:
    from urllib.parse import urlparse

    raw = (url or "").strip()
    if not raw:
        return ""
    if "://" not in raw:
        raw = f"https://{raw}"
    try:
        parsed = urlparse(raw)
        host = (parsed.hostname or "").lower()
        if not host:
            return ""
        if host.startswith("www."):
            host = host[4:]
        scheme = (parsed.scheme or "https").lower()
        if scheme not in ("http", "https"):
            scheme = "https"
        return f"{scheme}://{host}"
    except Exception:
        return ""


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("publications")}

    rows = conn.execute(sa.text("SELECT id, url FROM publications ORDER BY created_at ASC")).fetchall()
    seen: dict[str, str] = {}
    for row_id, url in rows:
        normalized = _normalize_url(url) or url
        if normalized in seen:
            conn.execute(sa.text("DELETE FROM publications WHERE id = :id"), {"id": row_id})
            continue
        seen[normalized] = str(row_id)
        conn.execute(
            sa.text("UPDATE publications SET url = :url WHERE id = :id"),
            {"url": normalized, "id": row_id},
        )

    if "url_key" in columns:
        op.drop_index("ix_publications_url_key", table_name="publications")
        op.drop_column("publications", "url_key")

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("publications")}
    if "ix_publications_url_unique" not in existing_indexes:
        op.create_index("ix_publications_url_unique", "publications", ["url"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_publications_url_unique", table_name="publications")
    op.add_column("publications", sa.Column("url_key", sa.String(length=256), nullable=True))
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, url FROM publications")).fetchall()
    for row_id, url in rows:
        from urllib.parse import urlparse

        try:
            host = urlparse(url).hostname or ""
            if host.startswith("www."):
                host = host[4:]
            key = host.lower()
        except Exception:
            key = url
        conn.execute(
            sa.text("UPDATE publications SET url_key = :key WHERE id = :id"),
            {"key": key or url, "id": row_id},
        )
    op.alter_column("publications", "url_key", nullable=False)
    op.create_index("ix_publications_url_key", "publications", ["url_key"], unique=True)
