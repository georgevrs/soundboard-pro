from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, CheckConstraint, ARRAY, REAL, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db import Base


class Sound(Base):
    __tablename__ = "sounds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(ARRAY(Text), nullable=False, default=[])
    source_type = Column(Text, nullable=False)  # DIRECT_URL, YOUTUBE, LOCAL_FILE
    source_url = Column(Text, nullable=True)  # for direct/youtube
    local_path = Column(Text, nullable=True)  # for local/youtube after download
    cover_image_path = Column(Text, nullable=True)
    volume = Column(Integer, nullable=True)  # 0-100
    trim_start_sec = Column(REAL, nullable=True)
    trim_end_sec = Column(REAL, nullable=True)
    output_device = Column(Text, nullable=True)  # per-sound override
    play_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    shortcuts = relationship("Shortcut", back_populates="sound", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("source_type IN ('DIRECT_URL', 'YOUTUBE', 'LOCAL_FILE')", name="check_source_type"),
        CheckConstraint("volume IS NULL OR (volume >= 0 AND volume <= 100)", name="check_volume_range"),
    )


class Shortcut(Base):
    __tablename__ = "shortcuts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sound_id = Column(UUID(as_uuid=True), ForeignKey("sounds.id", ondelete="CASCADE"), nullable=False)
    hotkey = Column(Text, nullable=False)
    action = Column(Text, nullable=False)  # PLAY, STOP, TOGGLE, RESTART
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    sound = relationship("Sound", back_populates="shortcuts")

    __table_args__ = (
        CheckConstraint("action IN ('PLAY', 'STOP', 'TOGGLE', 'RESTART')", name="check_action"),
    )


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, default=1)
    default_output_device = Column(Text, nullable=True)
    mpv_path = Column(Text, nullable=False, default="mpv")
    ytdlp_path = Column(Text, nullable=False, default="yt-dlp")
    storage_dir = Column(Text, nullable=False)
    stop_previous_on_play = Column(Boolean, nullable=False, default=True)
    allow_overlapping = Column(Boolean, nullable=False, default=False)
    default_volume = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
