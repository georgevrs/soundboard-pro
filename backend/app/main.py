from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import sounds, shortcuts, settings as settings_router, playback
from app.services.system_shortcuts import system_shortcut_service
from app.db import SessionLocal
from app.models import Shortcut, Sound, Settings as SettingsModel
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
    """Sync all shortcuts to system on startup. Uses direct mpv commands when sound has local_path so shortcuts work when app is not running."""
    try:
        db = SessionLocal()
        try:
            settings_row = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
            mpv_path = (settings_row and settings_row.mpv_path) or "mpv"
            audio_device = (settings_row and settings_row.default_output_device) or ""

            shortcuts_list = db.query(Shortcut).filter(Shortcut.enabled == True).all()
            shortcut_data = []
            for shortcut in shortcuts_list:
                sound = db.query(Sound).filter(Sound.id == shortcut.sound_id).first()
                local_path = None
                if sound and sound.local_path:
                    try:
                        local_path = str(Path(sound.local_path).resolve())
                    except Exception:
                        local_path = sound.local_path
                shortcut_data.append({
                    "id": str(shortcut.id),
                    "hotkey": shortcut.hotkey,
                    "sound_id": str(shortcut.sound_id),
                    "sound_name": sound.name if sound else "Unknown",
                    "action": shortcut.action,
                    "enabled": shortcut.enabled,
                    "local_path": local_path,
                    "volume": sound.volume if sound else None,
                    "trim_start_sec": float(sound.trim_start_sec) if sound and sound.trim_start_sec is not None else None,
                    "trim_end_sec": float(sound.trim_end_sec) if sound and sound.trim_end_sec is not None else None,
                })

            if shortcut_data:
                system_shortcut_service.sync_all_shortcuts(
                    shortcut_data,
                    mpv_path=mpv_path,
                    audio_device=audio_device,
                )
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
