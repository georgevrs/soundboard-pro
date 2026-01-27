import { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  Edit3, 
  Trash2,
  Keyboard,
  Link,
  Youtube,
  FolderOpen,
  Clock,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sound, Shortcut } from '@/types/sound';
import { HotkeyBadge } from './HotkeyBadge';
import { TagPill } from './TagPill';
import { WaveformVisualizer } from './WaveformVisualizer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface InspectorPanelProps {
  sound: Sound | null;
  shortcut?: Shortcut;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onEdit?: () => void;
  onBindShortcut?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function InspectorPanel({
  sound,
  shortcut,
  isPlaying,
  onPlay,
  onStop,
  onEdit,
  onBindShortcut,
  onDelete,
  onClose,
}: InspectorPanelProps) {
  // Handle bind shortcut button click
  const handleBindShortcutClick = () => {
    if (onBindShortcut) {
      onBindShortcut();
    }
  };
  const [volume, setVolume] = useState(sound?.volume ?? 75);
  
  // Handle edit button click
  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    }
  };

  if (!sound) {
    return (
      <div className="inspector-panel flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a sound to view details</p>
        </div>
      </div>
    );
  }

  const sourceInfo = {
    DIRECT_URL: { icon: Link, label: 'Direct URL' },
    YOUTUBE: { icon: Youtube, label: 'YouTube' },
    LOCAL_FILE: { icon: FolderOpen, label: 'Local File' },
  }[sound.sourceType];

  return (
    <div className="inspector-panel flex flex-col">
      {/* Cover Image */}
      <div className="relative aspect-video bg-secondary overflow-hidden">
        {sound.coverImage ? (
          <img 
            src={sound.coverImage} 
            alt={sound.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
            <Volume2 className="w-20 h-20 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Playing overlay */}
        {isPlaying && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <WaveformVisualizer isPlaying={true} barCount={12} className="h-10 justify-center mb-2" />
              <span className="text-sm font-medium text-foreground">Now Playing</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">{sound.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <sourceInfo.icon className="w-3 h-3" />
              <span>{sourceInfo.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleEditClick}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={isPlaying ? onStop : onPlay}
            className={cn(
              "flex-1",
              isPlaying && "bg-primary glow-primary"
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play
              </>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={onStop}>
            <Square className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              Volume
            </span>
            <span className="font-medium">{volume}%</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Shortcut */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcut
            </span>
          </div>
          {shortcut ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <HotkeyBadge hotkey={shortcut.hotkey} />
              <span className="text-xs text-muted-foreground capitalize">
                {shortcut.action.toLowerCase()}
              </span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleBindShortcutClick}
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Bind Shortcut
            </Button>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Description</span>
          <p className="text-sm text-foreground">{sound.description}</p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {sound.tags.map(tag => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Play count
            </span>
            <span className="font-medium">{sound.playCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Added
            </span>
            <span className="font-medium">
              {sound.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
