import { Sound, Shortcut, Settings } from '@/types/sound';

// Backend response types (snake_case)
interface BackendSound {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  source_type: 'DIRECT_URL' | 'YOUTUBE' | 'LOCAL_FILE';
  source_url: string | null;
  local_path: string | null;
  cover_image_path: string | null;
  volume: number | null;
  trim_start_sec: number | null;
  trim_end_sec: number | null;
  output_device: string | null;
  play_count: number;
  created_at: string;
  updated_at: string;
}

interface BackendShortcut {
  id: string;
  sound_id: string;
  hotkey: string;
  action: 'PLAY' | 'STOP' | 'TOGGLE' | 'RESTART';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface BackendSettings {
  id: number;
  default_output_device: string | null;
  mpv_path: string;
  ytdlp_path: string;
  storage_dir: string;
  stop_previous_on_play: boolean;
  allow_overlapping: boolean;
  default_volume: number | null;
  updated_at: string;
}

// Transform backend sound to frontend format
export function transformSound(backend: BackendSound): Sound {
  // Determine source based on source_type
  let source = '';
  if (backend.source_type === 'LOCAL_FILE' || (backend.source_type === 'YOUTUBE' && backend.local_path)) {
    source = backend.local_path || '';
  } else {
    source = backend.source_url || '';
  }

  // Convert cover image path to URL
  let coverImageUrl = '';
  if (backend.cover_image_path) {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    coverImageUrl = `${API_BASE_URL}/sounds/${backend.id}/cover`;
  }

  return {
    id: backend.id,
    name: backend.name,
    description: backend.description || '',
    tags: backend.tags || [],
    sourceType: backend.source_type,
    source: source,
    coverImage: coverImageUrl,
    volume: backend.volume ?? 80,
    trimStartSec: backend.trim_start_sec ?? undefined,
    trimEndSec: backend.trim_end_sec ?? undefined,
    defaultOutputDevice: backend.output_device ?? undefined,
    createdAt: new Date(backend.created_at),
    updatedAt: new Date(backend.updated_at),
    playCount: backend.play_count,
  };
}

// Transform backend shortcut to frontend format
export function transformShortcut(backend: BackendShortcut): Shortcut {
  return {
    id: backend.id,
    soundId: backend.sound_id,
    hotkey: backend.hotkey,
    action: backend.action,
    enabled: backend.enabled,
  };
}

// Transform backend settings to frontend format
export function transformSettings(backend: BackendSettings): Settings {
  return {
    audioOutputDevice: backend.default_output_device || '',
    mpvPath: backend.mpv_path,
    youtubeDownloadTool: backend.ytdlp_path,
    defaultVolume: backend.default_volume ?? 80,
    stopPreviousOnPlay: backend.stop_previous_on_play,
    allowOverlappingSounds: backend.allow_overlapping,
  };
}
