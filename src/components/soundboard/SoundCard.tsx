import { useState } from 'react';
import { Play, Pause, MoreVertical, Volume2, Keyboard, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sound, Shortcut } from '@/types/sound';
import { HotkeyBadge } from './HotkeyBadge';
import { TagPill } from './TagPill';
import { WaveformVisualizer } from './WaveformVisualizer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SoundCardProps {
  sound: Sound;
  shortcut?: Shortcut;
  isPlaying?: boolean;
  isSelected?: boolean;
  onPlay: () => void;
  onSelect: () => void;
  onDelete?: () => void;
}

export function SoundCard({ 
  sound, 
  shortcut, 
  isPlaying = false,
  isSelected = false,
  onPlay, 
  onSelect,
  onDelete
}: SoundCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sourceIcon = {
    DIRECT_URL: '🔗',
    YOUTUBE: '▶️',
    LOCAL_FILE: '📁',
  }[sound.sourceType];

  return (
    <div
      className={cn(
        "sound-card cursor-pointer group",
        isPlaying && "is-playing",
        isSelected && "ring-2 ring-primary/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Cover Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-secondary">
        {sound.coverImage ? (
          <img 
            src={sound.coverImage} 
            alt={sound.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Volume2 className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm transition-opacity duration-200",
          isHovered || isPlaying ? "opacity-100" : "opacity-0"
        )}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className={cn(
              "control-btn w-12 h-12",
              isPlaying ? "primary" : "bg-card hover:bg-primary hover:text-primary-foreground"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </div>

        {/* Source Type Badge */}
        <div className="absolute top-2 left-2 text-sm">
          {sourceIcon}
        </div>

        {/* Hotkey Badge */}
        {shortcut && shortcut.enabled && (
          <div className="absolute top-2 right-2">
            <HotkeyBadge hotkey={shortcut.hotkey} size="sm" />
          </div>
        )}

        {/* Playing Indicator */}
        {isPlaying && (
          <div className="absolute bottom-2 left-2 right-2">
            <WaveformVisualizer isPlaying={true} barCount={8} className="h-6" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">{sound.name}</h3>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {sound.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {sound.tags.slice(0, 3).map(tag => (
            <TagPill key={tag} tag={tag} className="text-[10px] px-1.5 py-0" />
          ))}
          {sound.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{sound.tags.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span>{sound.playCount} plays</span>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            <span>{sound.volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
