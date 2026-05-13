import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.user import UserOut


class CommentCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("content cannot be empty")
        if len(v) > 1000:
            raise ValueError("content must be 1000 characters or fewer")
        return v


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    content: str
    created_at: datetime
    author: UserOut
