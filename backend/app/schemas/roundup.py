from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.publication import PublicationOut


class RoundupSummary(BaseModel):
    """List-view shape for the /blogs index."""

    slug: str
    title: str
    category: str
    week_start: date
    count: int
    underrated_count: int = 0
    created_at: datetime


class RoundupDetail(RoundupSummary):
    """Single roundup with its publications hydrated.

    `publications` is the top picks; `underrated` is the parallel lowest-scored
    list shown alongside them.
    """

    publications: list[PublicationOut]
    underrated: list[PublicationOut] = []
