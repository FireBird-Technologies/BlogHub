import uuid
from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None
    bio: str | None


class UserUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
