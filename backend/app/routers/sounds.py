from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from uuid import UUID
from app.db import get_db
from app.models import Sound
from app.schemas import SoundCreate, SoundUpdate, SoundResponse
from app.services.storage import storage_service
from app.services.youtube import youtube_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sounds", tags=["sounds"])


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

    # Tag filter
    if tag:
        query = query.filter(Sound.tags.contains([tag]))

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

    # Determine extension
    extension = "jpg"
    if file.filename:
        ext = file.filename.split(".")[-1].lower()
        if ext in ["jpg", "jpeg", "png", "gif", "webp"]:
            extension = ext

    # Save file
    content = await file.read()
    cover_path = storage_service.save_cover_image(str(sound_id), content, extension)

    sound.cover_image_path = cover_path
    db.commit()
    db.refresh(sound)
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
        # Already downloaded
        return sound

    # Validate YouTube URL
    if not youtube_service.validate_youtube_url(sound.source_url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        # Download audio
        local_path = await youtube_service.download_audio(
            sound.source_url, str(sound_id)
        )
        sound.local_path = local_path
        db.commit()
        db.refresh(sound)
        return sound
    except Exception as e:
        logger.error(f"Failed to ingest sound {sound_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download audio: {str(e)}")
