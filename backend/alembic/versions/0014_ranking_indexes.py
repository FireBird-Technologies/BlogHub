"""indexes to support day-bucket + engagement ranking query

Revision ID: 0014
Revises: 0013
Create Date: 2026-06-11 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0014"
down_revision: Union[str, None] = "0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    pub_indexes = {idx["name"] for idx in inspector.get_indexes("publications")}
    comment_indexes = {idx["name"] for idx in inspector.get_indexes("comments")}

    # Covers ORDER BY date_trunc('day', created_at) DESC, upvote_count DESC, id DESC
    # used by the ranked feed query.
    if "ix_publications_rank_sort" not in pub_indexes:
        op.execute(
            "CREATE INDEX ix_publications_rank_sort "
            "ON publications (created_at DESC, upvote_count DESC, id DESC)"
        )

    # Covers the category-filtered variant of the same query.
    if "ix_publications_category_rank_sort" not in pub_indexes:
        op.execute(
            "CREATE INDEX ix_publications_category_rank_sort "
            "ON publications (category, created_at DESC, upvote_count DESC, id DESC)"
        )

    # Covers the GROUP BY on comments used for the engagement sub-select.
    if "ix_comments_publication_id_count" not in comment_indexes:
        op.execute(
            "CREATE INDEX ix_comments_publication_id_count "
            "ON comments (publication_id) INCLUDE (id)"
        )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_publications_rank_sort")
    op.execute("DROP INDEX IF EXISTS ix_publications_category_rank_sort")
    op.execute("DROP INDEX IF EXISTS ix_comments_publication_id_count")
