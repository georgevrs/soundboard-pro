import { Plus, Music, Keyboard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface EmptyStateProps {
  onAddSound: () => void;
}

export function EmptyState({ onAddSound }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
          <Music className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('empty.title')}
        </h2>
        <p className="text-muted-foreground mb-8">
          {t('empty.subtitle')}
        </p>

        <Button onClick={onAddSound} size="lg" className="glow-primary mb-8">
          <Plus className="w-5 h-5 mr-2" />
          {t('empty.addFirst')}
        </Button>

        <div className="grid gap-4 text-left">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔗</span>
            </div>
            <div>
              <p className="font-medium text-foreground">{t('empty.directTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('empty.directDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">▶️</span>
            </div>
            <div>
              <p className="font-medium text-foreground">{t('empty.youtubeTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('empty.youtubeDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📁</span>
            </div>
            <div>
              <p className="font-medium text-foreground">{t('empty.localTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('empty.localDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Keyboard className="w-4 h-4" />
            <span className="font-medium">{t('app.proTip')}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('empty.proTipText')}
          </p>
        </div>
      </div>
    </div>
  );
}
