from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from sqlalchemy.dialects.postgresql import array
from typing import List, Optional
from uuid import UUID
from pathlib import Path
from app.db import get_db
from app.models import Sound, Shortcut, Settings as SettingsModel
from app.schemas import SoundCreate, SoundUpdate, SoundResponse
from app.services.storage import storage_service
from app.services.youtube import youtube_service
from app.services.system_shortcuts import system_shortcut_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sounds", tags=["sounds"])


def _resync_shortcuts_for_sound(sound_id: UUID, db: Session) -> None:
    """Re-register all enabled shortcuts for this sound (e.g. after local_path is set)."""
    try:
        sound = db.query(Sound).filter(Sound.id == sound_id).first()
        if not sound:
            return
        shortcuts = db.query(Shortcut).filter(
            Shortcut.sound_id == sound_id,
            Shortcut.enabled == True,
        ).all()
        if not shortcuts:
            return
        settings_row = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
        mpv_path = (settings_row and settings_row.mpv_path) or "mpv"
        audio_device = (settings_row and settings_row.default_output_device) or ""
        local_path = None
        if sound.local_path:
            try:
                local_path = str(Path(sound.local_path).resolve())
            except Exception:
                local_path = sound.local_path
        for shortcut in shortcuts:
            system_shortcut_service.register_shortcut(
                str(shortcut.id),
                shortcut.hotkey,
                str(shortcut.sound_id),
                sound.name,
                shortcut.action.lower(),
                local_path=local_path,
                volume=sound.volume,
                trim_start_sec=float(sound.trim_start_sec) if sound.trim_start_sec is not None else None,
                trim_end_sec=float(sound.trim_end_sec) if sound.trim_end_sec is not None else None,
                mpv_path=mpv_path,
                audio_device=audio_device,
            )
    except Exception as e:
        logger.warning("Failed to resync shortcuts for sound %s: %s", sound_id, e)


@router.get("", response_model=List[SoundResponse])
def list_sounds(
    q: Optional[str] = Query(None, description="Search query"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    sort: Optional[str] = Query("recent", description="Sort: recent, name, plays"),
    db: Session = Depends(get_db),
):
    """List sounds with optional filtering and sorting"""
    query = db.query(Sound)

    # Search
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Sound.name.ilike(search_term),
                Sound.description.ilike(search_term),
                func.array_to_string(Sound.tags, ",").ilike(search_term),
            )
        )

    # Tag filter - check if the tag string is in the tags array
    # Use PostgreSQL array containment operator @> to check if array contains the value
    if tag:
        query = query.filter(Sound.tags.op('@>')(array([tag])))

    # Source type filter
    if source_type:
        query = query.filter(Sound.source_type == source_type)

    # Sorting
    if sort == "name":
        query = query.order_by(Sound.name)
    elif sort == "plays":
        query = query.order_by(Sound.play_count.desc())
    else:  # recent
        query = query.order_by(Sound.created_at.desc())

    return query.all()


@router.post("", response_model=SoundResponse, status_code=201)
def create_sound(sound: SoundCreate, db: Session = Depends(get_db)):
    """Create a new sound"""
    db_sound = Sound(**sound.model_dump())
    db.add(db_sound)
    db.commit()
    db.refresh(db_sound)
    return db_sound


@router.get("/{sound_id}", response_model=SoundResponse)
def get_sound(sound_id: UUID, db: Session = Depends(get_db)):
    """Get a sound by ID"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    return sound


@router.put("/{sound_id}", response_model=SoundResponse)
def update_sound(
    sound_id: UUID, sound_update: SoundUpdate, db: Session = Depends(get_db)
):
    """Update a sound"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")

    update_data = sound_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sound, field, value)

    db.commit()
    db.refresh(sound)
    return sound


@router.delete("/{sound_id}", status_code=204)
def delete_sound(sound_id: UUID, db: Session = Depends(get_db)):
    """Delete a sound"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")

    # Delete associated files
    if sound.local_path and storage_service.file_exists(sound.local_path):
        storage_service.delete_file(sound.local_path)
    if sound.cover_image_path and storage_service.file_exists(sound.cover_image_path):
        storage_service.delete_file(sound.cover_image_path)

    db.delete(sound)
    db.commit()
    return None


@router.post("/{sound_id}/cover", response_model=SoundResponse)
async def upload_cover(
    sound_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a cover image for a sound"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")

    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Expected image, got: {file.content_type}"
        )

    # Determine extension from filename or content type
    extension = "jpg"
    if file.filename:
        ext = file.filename.split(".")[-1].lower()
        if ext in ["jpg", "jpeg", "png", "gif", "webp"]:
            extension = ext
    elif file.content_type:
        # Fallback to content type
        content_type_map = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
        }
        extension = content_type_map.get(file.content_type, "jpg")

    try:
        # Read and validate file size (max 10MB)
        content = await file.read()
        max_size = 10 * 1024 * 1024  # 10MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is 10MB, got {len(content) / 1024 / 1024:.2f}MB"
            )

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file provided")

        # Save file
        logger.info(f"Uploading cover image for sound {sound_id}, size: {len(content)} bytes, type: {extension}")
        cover_path = storage_service.save_cover_image(str(sound_id), content, extension)

        sound.cover_image_path = cover_path
        db.commit()
        db.refresh(sound)
        
        logger.info(f"Successfully uploaded cover image for sound {sound_id} to {cover_path}")
        return sound
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload cover image for sound {sound_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload cover image: {str(e)}")


@router.get("/{sound_id}/cover")
async def get_cover_image(sound_id: UUID, db: Session = Depends(get_db)):
    """Get cover image for a sound"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    if not sound.cover_image_path:
        raise HTTPException(status_code=404, detail="No cover image for this sound")
    
    cover_path = Path(sound.cover_image_path)
    if not cover_path.exists():
        raise HTTPException(status_code=404, detail="Cover image file not found")
    
    # Determine media type based on extension
    extension = cover_path.suffix.lower()
    media_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    }
    media_type = media_type_map.get(extension, 'image/jpeg')
    
    return FileResponse(
        str(cover_path),
        media_type=media_type,
        filename=cover_path.name
    )


@router.post("/{sound_id}/audio", response_model=SoundResponse)
async def upload_audio(
    sound_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload an audio file for a sound"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")

    if sound.source_type != "LOCAL_FILE":
        raise HTTPException(
            status_code=400, detail="Audio upload only available for LOCAL_FILE sounds"
        )

    # Determine extension
    extension = "mp3"
    if file.filename:
        ext = file.filename.split(".")[-1].lower()
        if ext in ["mp3", "wav", "ogg", "m4a", "flac", "opus", "webm"]:
            extension = ext

    # Save file
    content = await file.read()
    audio_path = storage_service.get_audio_path(str(sound_id), extension)
    audio_path.write_bytes(content)

    sound.local_path = str(audio_path)
    db.commit()
    db.refresh(sound)
    _resync_shortcuts_for_sound(sound_id, db)
    return sound


@router.post("/{sound_id}/ingest", response_model=SoundResponse)
async def ingest_sound(sound_id: UUID, db: Session = Depends(get_db)):
    """Download/ingest a sound (for YouTube URLs)"""
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")

    if sound.source_type != "YOUTUBE":
        raise HTTPException(
            status_code=400, detail="Ingest only available for YouTube sources"
        )

    if not sound.source_url:
        raise HTTPException(
            status_code=400, detail="No source URL provided for YouTube sound"
        )

    if sound.local_path and storage_service.file_exists(sound.local_path):
        # Already downloaded - mark as READY
        if sound.ingest_status != "READY":
            sound.ingest_status = "READY"
            sound.last_error = None
            db.commit()
        return sound

    # Validate YouTube URL
    if not youtube_service.validate_youtube_url(sound.source_url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    # Update status to IN_PROGRESS
    sound.ingest_status = "IN_PROGRESS"
    sound.last_error = None
    db.commit()

    try:
        # Download audio (returns dict with file path and metadata)
        result = await youtube_service.download_audio(
            sound.source_url, str(sound_id)
        )
        sound.local_path = result["file"]
        sound.ingest_status = "READY"
        sound.last_error = None
        sound.ingest_retry_count = 0  # Reset retry count on success
        
        # Optionally update metadata from download (title, duration, etc.)
        metadata = result.get("metadata", {})
        if metadata.get("title") and not sound.description:
            # Use video title as description if none exists
            sound.description = metadata["title"]
        
        db.commit()
        db.refresh(sound)
        _resync_shortcuts_for_sound(sound_id, db)
        return sound
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to ingest sound {sound_id}: {error_msg}")
        
        # Mark as FAILED and store error
        sound.ingest_status = "FAILED"
        sound.last_error = error_msg[:500]  # Limit error message length
        sound.ingest_retry_count = (sound.ingest_retry_count or 0) + 1
        db.commit()
        
        # Provide helpful error message based on retry count
        if sound.ingest_retry_count >= 3:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Download failed after {sound.ingest_retry_count} attempts. "
                    f"Error: {error_msg[:200]}\n\n"
                    "RECOMMENDATIONS:\n"
                    "1. Enable cookies: Set YTDLP_COOKIES_FROM_BROWSER=chrome in .env\n"
                    "2. Update yt-dlp: pip install -U yt-dlp\n"
                    "3. Try a different video URL\n"
                    "4. Check if video is region/age-restricted"
                )
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to download audio (attempt {sound.ingest_retry_count}): {error_msg[:300]}"
            )
