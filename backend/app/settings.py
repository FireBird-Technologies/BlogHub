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
    NEWSLETTER_FROM_EMAIL: str = "BlogHub <digest@bloghub.app>"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
