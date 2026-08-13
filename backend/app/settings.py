from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_CLIENT_ID: str
    FRONTEND_URL: str
    BACKEND_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 168
    OPEN_ROUTER_KEY: str | None = None
    OPENROUTER_MODEL: str = "deepseek/deepseek-chat"
    FIRECRAWL_API_KEY: str | None = None
    # Publication claim notifications (Resend)
    RESEND_API_KEY: str | None = None
    CLAIM_NOTIFY_EMAIL: str | None = None
    CLAIM_FROM_EMAIL: str = "BlogHub <claims@bloghub.app>"
    CLAIM_APPROVE_PASSWORD: str | None = None
    # Weekly digest (cron-triggered)
    CRON_SECRET: str | None = None
    NEWSLETTER_FROM_EMAIL: str = "BlogHub <topposts@bloghub.app>"
    NO_REPLY_FROM_EMAIL: str = "BlogHub <noreply@bloghub.app>"
    # Paid featured publication (Stripe)
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    # One-time Prices (price_...) for featured runs, created in the Stripe dashboard.
    # The amount lives in Stripe, so it can be changed without a deploy.
    STRIPE_FEATURED_PRICE_ID_7D: str | None = None
    STRIPE_FEATURED_PRICE_ID_14D: str | None = None
    STRIPE_FEATURED_PRICE_ID_30D: str | None = None
    FEATURE_NOTIFY_EMAIL: str = "arslan@firebird-technologies.com"
    FEATURE_FROM_EMAIL: str = "BlogHub <featured@bloghub.app>"
    # Product-update email campaigns (DB-driven daily batches). Sent from Arslan
    # personally, not the BlogHub newsletter address.
    UPDATE_EMAIL_FROM_EMAIL: str = "BlogHub <team@send.bloghub.app>"
    # Replies go to team@bloghub.app, which forwards to Arslan's inbox.
    UPDATE_EMAIL_REPLY_TO: str = "team@bloghub.app"
    # Default UTC hour (0-23) a campaign's daily batch runs when its send_hour is -1.
    UPDATE_EMAIL_SEND_HOUR: int = 9
    # "Someone shared a publication with you" invites, sent from the share modal to
    # addresses a user typed. Its own sender so these are separable from product-update
    # mail in Resend's logs and in any future domain-reputation triage — an invite goes
    # to people who never signed up, so it carries more spam-complaint risk than mail
    # to existing users. Replies go to the same place as update email.
    INVITE_NOTIFY_EMAIL: str = "BlogHub <invites@send.bloghub.app>"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
