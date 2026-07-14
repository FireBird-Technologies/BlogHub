import re
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.publication import PublicationOut

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class FeaturedSlotOut(BaseModel):
    """A booked date range, used by the frontend to disable days in the calendar."""

    start_date: date
    end_date: date
    status: str  # "pending" (an unpaid hold) or "paid"


class FeaturedAvailabilityOut(BaseModel):
    booked: list[FeaturedSlotOut]
    prices: dict[int, int]  # duration_days -> price in cents
    min_start_date: date
    max_start_date: date


class FeatureCheckoutIn(BaseModel):
    publication_id: uuid.UUID
    start_date: date
    duration_days: int = 7


class FeatureCheckoutOut(BaseModel):
    checkout_url: str
    slot_id: uuid.UUID
    amount_cents: int
    start_date: date
    end_date: date


class ActiveFeatureOut(BaseModel):
    publication: PublicationOut
    start_date: date
    end_date: date
    #: Outbound clicks BlogHub has sent to this publication during its featured run.
    click_count: int = 0


class SupportRequestIn(BaseModel):
    """Contact-form message. Lengths are capped: the endpoint is public, so it must
    not become an open relay for sending arbitrarily large mail."""

    name: str = Field(default="", max_length=100)
    email: str = Field(max_length=254)
    subject: str = Field(min_length=1, max_length=150)
    message: str = Field(min_length=1, max_length=4000)

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        s = v.strip()
        if not _EMAIL_RE.match(s):
            raise ValueError("a valid email address is required")
        return s


class ApproveSlotRequest(BaseModel):
    """Admin decision on a paid booking. The password is the only gate — it goes in
    the body, never the URL, so an emailed link cannot leak it."""

    password: str
    approve: bool = True


class ApproveSlotOut(BaseModel):
    ok: bool
    slot_id: uuid.UUID
    approval_status: str


class AdminPasswordIn(BaseModel):
    password: str


class SlotReviewOut(BaseModel):
    """Everything the admin needs to decide on a booking, fetched with the password."""

    slot_id: uuid.UUID
    publication_title: str | None = None
    publication_url: str | None = None
    publication_description: str | None = None
    buyer_name: str | None = None
    buyer_email: str | None = None
    start_date: date
    end_date: date
    duration_days: int
    amount_cents: int
    currency: str
    approval_status: str
    # The announcement email the author has drafted for this booking.
    email_subject: str | None = None
    email_body: str | None = None
    email_finalised: bool = False  # the author has signed off on the wording
    email_status: str | None = None


class FeaturedEmailOut(BaseModel):
    id: uuid.UUID
    #: Which booking this announcement belongs to. A publication can hold several runs,
    #: each with its own email, so this is what pairs them up.
    slot_id: uuid.UUID
    publication_id: uuid.UUID
    publication_title: str | None = None
    #: The run this announcement is for — used to label it when there is more than one.
    start_date: date | None = None
    end_date: date | None = None
    subject: str
    body: str
    author_approved: bool
    admin_approved: bool
    status: str
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None


class MyBookingOut(BaseModel):
    """One of the author's own featured bookings, so they can see where it stands."""

    id: uuid.UUID
    publication_id: uuid.UUID
    publication_title: str | None = None
    start_date: date
    end_date: date
    approval_status: str  # pending | approved | rejected
    is_active: bool
    click_count: int = 0


class FeaturedEmailUpdateIn(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=8000)


class ReconcileOut(BaseModel):
    holds_released: int
    deactivated: int
    activated: int
