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
    website: str | None
    onboarded: bool


class UserUpdate(BaseModel):
    name: str | None = None
    tag: str | None = None
    website: str | None = None
    avatar_url: str | None = None
    onboarded: bool | None = None

    @field_validator("avatar_url")
    @classmethod
    def _avatar_not_too_large(cls, v: str | None) -> str | None:
        if v is not None and len(v) > MAX_AVATAR_LENGTH:
            raise ValueError("Avatar image is too large; please use a smaller image.")
        return v
