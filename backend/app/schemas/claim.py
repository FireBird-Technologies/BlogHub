import re
import uuid
from datetime import datetime

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, field_validator, model_validator

from app.helpers.url_normalize import normalize_publication_url
from app.models.publication import normalize_category

MAX_CLAIM_SOCIAL_LINKS = 8


class ClaimSocialLink(BaseModel):
    label: str
    url: AnyHttpUrl

    @field_validator("label")
    @classmethod
    def label_ok(cls, v: str) -> str:
        s = v.strip()
        if not s or len(s) > 64:
            raise ValueError("label must be 1–64 characters")
        return s


class ClaimCreate(BaseModel):
    name: str
    social_links: list[ClaimSocialLink] = []
    original_url: AnyHttpUrl | None = None
    comment: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 2 or len(s) > 100:
            raise ValueError("Name must be 2–100 characters")
        if not re.search(r"[A-Za-z]", s):
            raise ValueError("Please enter a real name")
        return s

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        if not s:
            return None
        if len(s) > 2000:
            raise ValueError("Message must be 2000 characters or fewer")
        return s

    @field_validator("social_links")
    @classmethod
    def cap_social(cls, v: list) -> list:
        if len(v) > MAX_CLAIM_SOCIAL_LINKS:
            raise ValueError(f"at most {MAX_CLAIM_SOCIAL_LINKS} social links")
        return v

    @model_validator(mode="after")
    def require_evidence(self) -> "ClaimCreate":
        if not self.social_links and not self.original_url:
            raise ValueError(
                "Add at least one social profile or the original publication link"
            )
        return self


class ClaimOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    created_at: datetime
    verified_at: datetime | None = None


class ResubmitSocialLink(BaseModel):
    label: str
    url: AnyHttpUrl

    @field_validator("label")
    @classmethod
    def label_ok(cls, v: str) -> str:
        s = v.strip()
        if not s or len(s) > 64:
            raise ValueError("label must be 1–64 characters")
        return s


class ResubmitAndClaimCreate(BaseModel):
    """Combined payload for updating an unverified publication + submitting a claim."""

    # Publication fields
    url: str
    title: str
    description: str | None = None
    image_url: str | None = None
    category: str
    tags: list[str] = []
    additional_links: list[AnyHttpUrl] = []
    social_links: list[ResubmitSocialLink] = []

    # Claim fields
    name: str
    claim_social_links: list[ClaimSocialLink] = []
    original_url: AnyHttpUrl | None = None
    comment: str | None = None

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
        return normalize_category(v)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 2 or len(s) > 100:
            raise ValueError("Name must be 2–100 characters")
        if not re.search(r"[A-Za-z]", s):
            raise ValueError("Please enter a real name")
        return s

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        return s if s else None

    @model_validator(mode="after")
    def require_claim_evidence(self) -> "ResubmitAndClaimCreate":
        if not self.claim_social_links and not self.original_url:
            raise ValueError(
                "Add at least one social profile or the original publication link"
            )
        return self


class ApproveClaimRequest(BaseModel):
    claim_id: uuid.UUID
    password: str
