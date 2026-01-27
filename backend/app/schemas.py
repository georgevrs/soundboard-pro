from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class SoundBase(BaseModel):
    name: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    source_type: str = Field(..., pattern="^(DIRECT_URL|YOUTUBE|LOCAL_FILE)$")
    source_url: Optional[str] = None
    local_path: Optional[str] = None
    cover_image_path: Optional[str] = None
    volume: Optional[int] = Field(None, ge=0, le=100)
    trim_start_sec: Optional[float] = None
    trim_end_sec: Optional[float] = None
    output_device: Optional[str] = None
    ingest_status: Optional[str] = Field(None, pattern="^(PENDING|IN_PROGRESS|READY|FAILED)$")
    ingest_retry_count: Optional[int] = Field(None, ge=0)
    last_error: Optional[str] = None


class SoundCreate(SoundBase):
    pass


class SoundUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    source_type: Optional[str] = Field(None, pattern="^(DIRECT_URL|YOUTUBE|LOCAL_FILE)$")
    source_url: Optional[str] = None
    local_path: Optional[str] = None
    cover_image_path: Optional[str] = None
    volume: Optional[int] = Field(None, ge=0, le=100)
    trim_start_sec: Optional[float] = None
    trim_end_sec: Optional[float] = None
    output_device: Optional[str] = None


class SoundResponse(SoundBase):
    id: UUID
    play_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShortcutBase(BaseModel):
    sound_id: UUID
    hotkey: str
    action: str = Field(..., pattern="^(PLAY|STOP|TOGGLE|RESTART)$")
    enabled: bool = True


class ShortcutCreate(ShortcutBase):
    pass


class ShortcutUpdate(BaseModel):
    sound_id: Optional[UUID] = None
    hotkey: Optional[str] = None
    action: Optional[str] = Field(None, pattern="^(PLAY|STOP|TOGGLE|RESTART)$")
    enabled: Optional[bool] = None


class ShortcutResponse(ShortcutBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SettingsBase(BaseModel):
    default_output_device: Optional[str] = None
    mpv_path: str = "mpv"
    ytdlp_path: str = "yt-dlp"
    storage_dir: str
    stop_previous_on_play: bool = True
    allow_overlapping: bool = False
    default_volume: Optional[int] = Field(None, ge=0, le=100)


class SettingsResponse(SettingsBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class PlayRequest(BaseModel):
    restart: bool = False


class NowPlayingResponse(BaseModel):
    sound_id: UUID
    sound_name: str
    started_at: datetime
    process_id: int
