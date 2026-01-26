from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db import get_db
from app.models import Sound, Settings as SettingsModel
from app.schemas import PlayRequest, NowPlayingResponse
from app.services.player import player_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/playback", tags=["playback"])


def get_settings(db: Session) -> SettingsModel:
    """Get settings from database"""
    settings = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
    if not settings:
        # Create default settings
        from app.routers.settings import get_or_create_settings
        return get_or_create_settings(db)
    return settings


@router.post("/play/{sound_id}")
async def play_sound(
    sound_id: UUID,
    request: PlayRequest = PlayRequest(),
    db: Session = Depends(get_db),
):
    """Play a sound"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")

    # For YouTube sounds, ensure they're ingested
    if sound.source_type == "YOUTUBE" and not sound.local_path:
        raise HTTPException(
            status_code=400,
            detail="YouTube sound must be ingested first. Call POST /api/sounds/{id}/ingest",
        )

    settings = get_settings(db)

    try:
        session = await player_service.play(sound, settings, restart=request.restart)
        
        # Increment play count
        sound.play_count += 1
        db.commit()

        return {
            "sound_id": str(session.sound_id),
            "sound_name": session.sound_name,
            "started_at": session.started_at,
            "process_id": session.process_id,
        }
    except Exception as e:
        logger.error(f"Failed to play sound {sound_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to play sound: {str(e)}")


@router.post("/stop/{sound_id}")
def stop_sound(sound_id: UUID, db: Session = Depends(get_db)):
    """Stop a specific sound"""
    stopped = player_service.stop(sound_id)
    if not stopped:
        raise HTTPException(status_code=404, detail="Sound is not currently playing")
    return {"message": "Sound stopped"}


@router.post("/toggle/{sound_id}")
async def toggle_sound(sound_id: UUID, db: Session = Depends(get_db)):
    """Toggle playback (play if stopped, stop if playing)"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")

    if player_service.is_playing(sound_id):
        player_service.stop(sound_id)
        return {"action": "stopped", "sound_id": str(sound_id)}
    else:
        # Play the sound
        settings = get_settings(db)
        if sound.source_type == "YOUTUBE" and not sound.local_path:
            raise HTTPException(
                status_code=400,
                detail="YouTube sound must be ingested first",
            )
        
        session = await player_service.play(sound, settings, restart=False)
        sound.play_count += 1
        db.commit()
        
        return {
            "action": "playing",
            "sound_id": str(session.sound_id),
            "sound_name": session.sound_name,
            "started_at": session.started_at,
            "process_id": session.process_id,
        }


@router.post("/restart/{sound_id}")
async def restart_sound(sound_id: UUID, db: Session = Depends(get_db)):
    """Restart a sound (stop if playing, then play)"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")

    if sound.source_type == "YOUTUBE" and not sound.local_path:
        raise HTTPException(
            status_code=400,
            detail="YouTube sound must be ingested first",
        )

    settings = get_settings(db)
    session = await player_service.play(sound, settings, restart=True)
    
    sound.play_count += 1
    db.commit()

    return {
        "sound_id": str(session.sound_id),
        "sound_name": session.sound_name,
        "started_at": session.started_at,
        "process_id": session.process_id,
    }


@router.post("/stop-all")
async def stop_all(db: Session = Depends(get_db)):
    """Stop all currently playing sounds"""
    await player_service.stop_all()
    return {"message": "All sounds stopped"}


@router.get("/now-playing", response_model=List[NowPlayingResponse])
def get_now_playing(db: Session = Depends(get_db)):
    """Get list of currently playing sounds"""
    playing = player_service.get_now_playing()
    return playing
