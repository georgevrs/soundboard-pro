export type SourceType = 'DIRECT_URL' | 'YOUTUBE' | 'LOCAL_FILE';
export type ShortcutAction = 'PLAY' | 'STOP' | 'TOGGLE' | 'RESTART';

export interface Sound {
  id: string;
  name: string;
  description: string;
  tags: string[];
  sourceType: SourceType;
  source: string;
  coverImage: string;
  volume: number;
  trimStartSec?: number;
  trimEndSec?: number;
  defaultOutputDevice?: string;
  createdAt: Date;
  updatedAt: Date;
  playCount: number;
}

export interface Shortcut {
  id: string;
  soundId: string;
  hotkey: string;
  action: ShortcutAction;
  enabled: boolean;
}

export interface Settings {
  audioOutputDevice: string;
  mpvPath: string;
  youtubeDownloadTool: string;
  defaultVolume: number;
  stopPreviousOnPlay: boolean;
  allowOverlappingSounds: boolean;
}

export interface PlayingSound {
  soundId: string;
  startedAt: Date;
  progress: number;
}
