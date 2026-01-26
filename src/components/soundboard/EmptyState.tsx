import { Plus, Music, Keyboard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddSound: () => void;
}

export function EmptyState({ onAddSound }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
          <Music className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to KeySound Commander
        </h2>
        <p className="text-muted-foreground mb-8">
          Your personal soundboard with global keyboard shortcuts. Add your first sound to get started!
        </p>

        <Button onClick={onAddSound} size="lg" className="glow-primary mb-8">
          <Plus className="w-5 h-5 mr-2" />
          Add Your First Sound
        </Button>

        <div className="grid gap-4 text-left">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔗</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Direct URLs</p>
              <p className="text-sm text-muted-foreground">
                Link to MP3, WAV, or OGG audio files
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">▶️</span>
            </div>
            <div>
              <p className="font-medium text-foreground">YouTube</p>
              <p className="text-sm text-muted-foreground">
                Auto-download audio from YouTube URLs
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📁</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Local Files</p>
              <p className="text-sm text-muted-foreground">
                Use audio files from your computer
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Keyboard className="w-4 h-4" />
            <span className="font-medium">Pro tip</span>
          </div>
          <p className="text-sm text-muted-foreground">
            After adding sounds, bind keyboard shortcuts to trigger them instantly — 
            even when the app is running in the background!
          </p>
        </div>
      </div>
    </div>
  );
}
