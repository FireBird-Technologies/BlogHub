"""add featured_email_recipients, and a "sending" status for featured_emails

Per-recipient send tracking for the marketing blast. Previously an email was marked
`sent` the instant it was claimed, before a single message went out — a crash
mid-blast then meant no way to tell who had actually received it, so a retry would
either resend to everyone or (as chosen at the time) silently skip the rest.

Now each successful send is recorded as its own row, committed immediately after
that recipient's email leaves. `status` gains a `sending` value: claiming an email
moves it there (not to `sent`), and it only becomes `sent` once every subscribed
user as of that pass has a recorded row. A crash mid-blast leaves the row at
`sending`, which the scheduler picks back up on its next tick (or on restart) and
resumes — skipping anyone already recorded, so nobody receives it twice.

Revision ID: 0025
Revises: 0024
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0025"
down_revision: Union[str, None] = "0024"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "featured_email_recipients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "email_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("featured_emails.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
    )
    # The whole point of this table: a retry checks "has this (email, user) pair
    # already been recorded" before sending again. Unique makes that check race-safe
    # even if two scheduler ticks somehow overlapped.
    op.create_index(
        "ix_featured_email_recipients_email_user",
        "featured_email_recipients",
        ["email_id", "user_id"],
        unique=True,
    )
    op.create_index(
        "ix_featured_email_recipients_email_id",
        "featured_email_recipients",
        ["email_id"],
    )


def downgrade() -> None:
    op.drop_table("featured_email_recipients")
