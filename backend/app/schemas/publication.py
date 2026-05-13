import uuid
from datetime import datetime

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, field_validator

from app.schemas.user import UserOut
from app.models.publication import CATEGORIES

MAX_ADDITIONAL_LINKS = 5
MAX_SOCIAL_LINKS = 8


class SocialLinkIn(BaseModel):
    label: str
    url: AnyHttpUrl

    @field_validator("label")
    @classmethod
    def label_ok(cls, v: str) -> str:
        s = v.strip()
        if not s or len(s) > 64:
            raise ValueError("label must be 1–64 characters")
        return s


class _PublicationWritableFields(BaseModel):
    """Shared shape for create and full update."""

    url: str
    title: str
    description: str | None = None
    image_url: str | None = None
    category: str
    tags: list[str] = []
    additional_links: list[AnyHttpUrl] = []
    social_links: list[SocialLinkIn] = []

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(f"category must be one of {CATEGORIES}")
        return v

    @field_validator("additional_links")
    @classmethod
    def cap_additional(cls, v: list) -> list:
        if len(v) > MAX_ADDITIONAL_LINKS:
            raise ValueError(f"at most {MAX_ADDITIONAL_LINKS} additional links")
        return v

    @field_validator("social_links")
    @classmethod
    def cap_social(cls, v: list) -> list:
        if len(v) > MAX_SOCIAL_LINKS:
            raise ValueError(f"at most {MAX_SOCIAL_LINKS} social links")
        return v


class PublicationCreate(_PublicationWritableFields):
    pass


class PublicationUpdate(_PublicationWritableFields):
    """Owner-only full replace of editable fields (same body as create)."""


class SocialLinkOut(BaseModel):
    label: str
    url: str


class PublicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    title: str
    description: str | None
    image_url: str | None
    category: str
    tags: list[str]
    additional_links: list[str] = []
    social_links: list[SocialLinkOut] = []
    upvote_count: int
    comment_count: int = 0
    rank: int | None = None
    is_upvoted: bool = False
    created_at: datetime
    author: UserOut


class PaginatedPublications(BaseModel):
    items: list[PublicationOut]
    next_cursor: str | None
    total: int


class UpvoteResponse(BaseModel):
    upvote_count: int
    is_upvoted: bool
