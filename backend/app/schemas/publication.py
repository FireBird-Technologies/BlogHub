import uuid
from datetime import datetime

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, field_validator

from app.helpers.url_normalize import normalize_publication_url
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

    @field_validator("url")
    @classmethod
    def normalize_url(cls, v: str) -> str:
        canonical = normalize_publication_url(v)
        if not canonical:
            raise ValueError("url must be a valid site URL")
        return canonical

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("category is required")
        if len(s) > 64:
            raise ValueError("category must be 64 characters or fewer")
        for cat in CATEGORIES:
            if cat.lower() == s.lower():
                return cat
        return s[0].upper() + s[1:].lower()

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
    is_verified: bool = False
    verified_at: datetime | None = None
    my_claim_status: str = "none"  # none | pending | rejected
    created_at: datetime
    author: UserOut


class PaginatedPublications(BaseModel):
    items: list[PublicationOut]
    next_cursor: str | None
    total: int


class UpvoteResponse(BaseModel):
    upvote_count: int
    is_upvoted: bool


class ResubmitRequiredResponse(BaseModel):
    requires_claim: bool = True
    publication_id: uuid.UUID
