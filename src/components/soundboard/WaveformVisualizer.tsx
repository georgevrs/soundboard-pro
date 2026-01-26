import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  isPlaying?: boolean;
  barCount?: number;
  className?: string;
}

export function WaveformVisualizer({ 
  isPlaying = false, 
  barCount = 5,
  className 
}: WaveformVisualizerProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);
  
  return (
    <div className={cn("flex items-end gap-0.5 h-4", className)}>
      {bars.map((i) => (
        <div
          key={i}
          className={cn(
            "w-0.5 bg-primary/40 rounded-full transition-all",
            isPlaying && "bg-primary animate-waveform"
          )}
          style={{
            height: isPlaying ? '100%' : `${30 + Math.random() * 40}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
