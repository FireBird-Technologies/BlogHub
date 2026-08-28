import uuid
from pydantic import BaseModel, ConfigDict, field_validator

# Defensive cap on inline base64 avatars (~700 KB of data-URL text).
MAX_AVATAR_LENGTH = 700_000


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    tag: str
    avatar_url: str | None
    avatar_position: str | None = None
    avatar_scale: float | None = None
    website: str | None
    onboarded: bool
    is_active: bool = True
    is_blocked: bool = False


class UserUpdate(BaseModel):
    name: str | None = None
    tag: str | None = None
    website: str | None = None
    avatar_url: str | None = None
    avatar_position: str | None = None
    avatar_scale: float | None = None
    onboarded: bool | None = None

    @field_validator("avatar_url")
    @classmethod
    def _avatar_not_too_large(cls, v: str | None) -> str | None:
        if v is not None and len(v) > MAX_AVATAR_LENGTH:
            raise ValueError("Avatar image is too large; please use a smaller image.")
        return v

    @field_validator("avatar_position")
    @classmethod
    def _avatar_position_ok(cls, v: str | None) -> str | None:
        if v is None:
            return v
        s = v.strip()
        if not s:
            return None
        if len(s) > 32:
            raise ValueError("Invalid avatar position.")
        return s

    @field_validator("avatar_scale")
    @classmethod
    def _avatar_scale_ok(cls, v: float | None) -> float | None:
        if v is None:
            return v
        return max(1.0, min(5.0, float(v)))
