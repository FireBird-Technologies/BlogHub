from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_CLIENT_ID: str
    FRONTEND_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 168
    GEMINI_API_KEY: str | None = None
    # Preferred model id; discovery also lists models your key can use (see gemini_description helper).
    GEMINI_MODEL: str = "gemini-3-flash-preview"

    class Config:
        env_file = ".env"


settings = Settings()
