from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Settings as SettingsModel
from app.schemas import SettingsBase, SettingsResponse
from app.config import settings as app_settings

router = APIRouter(prefix="/settings", tags=["settings"])


def get_or_create_settings(db: Session) -> SettingsModel:
    """Get settings or create default if not exists"""
    settings = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
    if not settings:
        settings = SettingsModel(
            id=1,
            mpv_path=app_settings.MPV_PATH,
            ytdlp_path=app_settings.YTDLP_PATH,
            storage_dir=app_settings.STORAGE_DIR,
            stop_previous_on_play=app_settings.STOP_PREVIOUS_ON_PLAY,
            allow_overlapping=app_settings.ALLOW_OVERLAPPING,
            default_volume=app_settings.DEFAULT_VOLUME,
            default_output_device=app_settings.DEFAULT_OUTPUT_DEVICE or None,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """Get current settings"""
    return get_or_create_settings(db)


@router.put("", response_model=SettingsResponse)
def update_settings(settings_update: SettingsBase, db: Session = Depends(get_db)):
    """Update settings"""
    settings = get_or_create_settings(db)

    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
