from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import sounds, shortcuts, settings as settings_router, playback
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="KeySound Commander API",
    description="Backend API for keyboard-driven soundboard",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sounds.router, prefix="/api")
app.include_router(shortcuts.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(playback.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "KeySound Commander API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
