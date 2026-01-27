from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.db import get_db
from app.models import Shortcut, Sound
from app.schemas import ShortcutCreate, ShortcutUpdate, ShortcutResponse
from app.services.system_shortcuts import system_shortcut_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shortcuts", tags=["shortcuts"])


@router.get("", response_model=List[ShortcutResponse])
def list_shortcuts(db: Session = Depends(get_db)):
    """List all shortcuts"""
    return db.query(Shortcut).all()


@router.post("", response_model=ShortcutResponse, status_code=201)
def create_shortcut(shortcut: ShortcutCreate, db: Session = Depends(get_db)):
    """Create a new shortcut"""
    # Check for conflicts (enabled shortcuts with same hotkey)
    existing = (
        db.query(Shortcut)
        .filter(Shortcut.hotkey == shortcut.hotkey, Shortcut.enabled == True)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Hotkey {shortcut.hotkey} is already assigned to shortcut {existing.id}",
        )

    db_shortcut = Shortcut(**shortcut.model_dump())
    db.add(db_shortcut)
    db.commit()
    db.refresh(db_shortcut)
    
    # Register with system if enabled
    if db_shortcut.enabled:
        sound = db.query(Sound).filter(Sound.id == db_shortcut.sound_id).first()
        sound_name = sound.name if sound else "Unknown"
        system_shortcut_service.register_shortcut(
            str(db_shortcut.id),
            db_shortcut.hotkey,
            str(db_shortcut.sound_id),
            sound_name,
            db_shortcut.action.lower()
        )
    
    return db_shortcut


@router.get("/conflicts")
def check_conflicts(hotkey: str = Query(...), db: Session = Depends(get_db)):
    """Check if a hotkey conflicts with an existing enabled shortcut"""
    existing = (
        db.query(Shortcut)
        .filter(Shortcut.hotkey == hotkey, Shortcut.enabled == True)
        .first()
    )
    if existing:
        return {"conflict": True, "shortcut_id": str(existing.id), "sound_id": str(existing.sound_id)}
    return {"conflict": False}


@router.put("/{shortcut_id}", response_model=ShortcutResponse)
def update_shortcut(
    shortcut_id: UUID, shortcut_update: ShortcutUpdate, db: Session = Depends(get_db)
):
    """Update a shortcut"""
    shortcut = db.query(Shortcut).filter(Shortcut.id == shortcut_id).first()
    if not shortcut:
        raise HTTPException(status_code=404, detail="Shortcut not found")

    update_data = shortcut_update.model_dump(exclude_unset=True)

    # Check for hotkey conflicts if hotkey is being updated
    if "hotkey" in update_data:
        existing = (
            db.query(Shortcut)
            .filter(
                Shortcut.hotkey == update_data["hotkey"],
                Shortcut.enabled == True,
                Shortcut.id != shortcut_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Hotkey {update_data['hotkey']} is already assigned",
            )

    for field, value in update_data.items():
        setattr(shortcut, field, value)

    db.commit()
    db.refresh(shortcut)
    
    # Re-register with system if enabled, or unregister if disabled
    sound = db.query(Sound).filter(Sound.id == shortcut.sound_id).first()
    sound_name = sound.name if sound else "Unknown"
    
    if shortcut.enabled:
        system_shortcut_service.register_shortcut(
            str(shortcut.id),
            shortcut.hotkey,
            str(shortcut.sound_id),
            sound_name,
            shortcut.action.lower()
        )
    else:
        system_shortcut_service.unregister_shortcut(str(shortcut.id))
    
    return shortcut


@router.delete("/{shortcut_id}", status_code=204)
def delete_shortcut(shortcut_id: UUID, db: Session = Depends(get_db)):
    """Delete a shortcut"""
    shortcut = db.query(Shortcut).filter(Shortcut.id == shortcut_id).first()
    if not shortcut:
        raise HTTPException(status_code=404, detail="Shortcut not found")

    shortcut_id = str(shortcut.id)
    db.delete(shortcut)
    db.commit()
    
    # Unregister from system
    system_shortcut_service.unregister_shortcut(shortcut_id)
    
    return None
