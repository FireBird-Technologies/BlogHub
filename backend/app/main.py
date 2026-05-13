from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers.auth import router as auth_router
from app.routers.comments import router as comments_router
from app.routers.publications import router as publications_router
from app.routers.scraper import router as scraper_router
from app.routers.users import router as users_router
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="BlogHub API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(publications_router, prefix="/api")
app.include_router(comments_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(scraper_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
