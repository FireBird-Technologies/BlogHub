from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers.auth import router as auth_router
from app.routers.comments import router as comments_router
from app.routers.featured import router as featured_router
from app.routers.publications import router as publications_router
from app.routers.roundups import router as roundups_router
from app.routers.scraper import router as scraper_router
from app.routers.sitemap import router as sitemap_router
from app.routers.stripe_webhook import router as stripe_webhook_router
from app.routers.trending import router as trending_router
from app.routers.users import router as users_router
from app.scheduler import start_scheduler, stop_scheduler
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    scheduler = start_scheduler()
    try:
        yield
    finally:
        await stop_scheduler(scheduler)


app = FastAPI(title="BlogHub API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sitemap_router)
# Server-to-server callback from Stripe: POST /stripe/webhook. Mounted at the root
# (not /api) so the URL registered in the Stripe dashboard is independent of the API
# prefix and survives any future versioning of it.
app.include_router(stripe_webhook_router)
app.include_router(publications_router, prefix="/api")
app.include_router(trending_router, prefix="/api")
app.include_router(roundups_router, prefix="/api")
app.include_router(comments_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(scraper_router, prefix="/api")
app.include_router(featured_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
