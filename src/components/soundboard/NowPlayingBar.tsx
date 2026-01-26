import { Play, Pause, Square, SkipBack, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sound } from '@/types/sound';
import { WaveformVisualizer } from './WaveformVisualizer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

interface NowPlayingBarProps {
  currentSound: Sound | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStopAll: () => void;
  playingSoundsCount: number;
}

export function NowPlayingBar({
  currentSound,
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onStopAll,
  playingSoundsCount,
}: NowPlayingBarProps) {
  const [volume, setVolume] = useState(75);
  const [progress] = useState(35); // Mock progress

  if (!currentSound && playingSoundsCount === 0) {
    return null;
  }

  return (
    <div className="now-playing-bar h-20 flex items-center px-4 gap-4">
      {/* Left: Current Sound Info */}
      <div className="flex items-center gap-3 w-64">
        {currentSound && (
          <>
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {currentSound.coverImage ? (
                <img 
                  src={currentSound.coverImage} 
                  alt={currentSound.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/20">
                  <Volume2 className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{currentSound.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {playingSoundsCount > 1 && `+${playingSoundsCount - 1} more`}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Center: Playback Controls */}
      <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onStop}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full",
              isPlaying && "glow-primary"
            )}
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onStopAll}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2 px-4">
          <span className="text-xs text-muted-foreground w-10 text-right">0:12</span>
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10">0:35</span>
        </div>
      </div>

      {/* Right: Volume & Waveform */}
      <div className="flex items-center gap-4 w-64 justify-end">
        <WaveformVisualizer isPlaying={isPlaying} barCount={6} className="h-6" />
        
        <div className="flex items-center gap-2 w-32">
          <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
