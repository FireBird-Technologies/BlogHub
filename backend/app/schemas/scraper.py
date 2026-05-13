from pydantic import BaseModel


class ScrapeResult(BaseModel):
    url: str
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
