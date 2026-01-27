from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import sounds, shortcuts, settings as settings_router, playback
from app.services.system_shortcuts import system_shortcut_service
from app.db import SessionLocal
from app.models import Shortcut, Sound
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


@app.on_event("startup")
async def startup_event():
    """Sync all shortcuts to system on startup"""
    try:
        db = SessionLocal()
        try:
            # Get all enabled shortcuts with their sounds
            shortcuts = db.query(Shortcut).filter(Shortcut.enabled == True).all()
            shortcut_data = []
            for shortcut in shortcuts:
                sound = db.query(Sound).filter(Sound.id == shortcut.sound_id).first()
                shortcut_data.append({
                    "id": str(shortcut.id),
                    "hotkey": shortcut.hotkey,
                    "sound_id": str(shortcut.sound_id),
                    "sound_name": sound.name if sound else "Unknown",
                    "action": shortcut.action,
                    "enabled": shortcut.enabled,
                })
            
            if shortcut_data:
                system_shortcut_service.sync_all_shortcuts(shortcut_data)
                logger.info(f"Synced {len(shortcut_data)} shortcuts to system on startup")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to sync shortcuts on startup: {e}", exc_info=True)


@app.get("/")
def root():
    return {"message": "KeySound Commander API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
