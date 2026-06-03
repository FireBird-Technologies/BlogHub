from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.settings import settings

# Neon (serverless Postgres) scales the compute to zero after ~5 min idle. When it
# suspends, connections pooled by SQLAlchemy go stale. Without pre_ping the first
# request after idle hands out a dead connection and fails ("works on retry").
# pool_pre_ping validates/replaces dead connections transparently; pool_recycle
# drops connections older than the idle window; the connect timeout stops a stalled
# cold-start from hanging a worker indefinitely.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"timeout": 10},
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    from app.models import user, publication, upvote  # noqa: F401 — register models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
