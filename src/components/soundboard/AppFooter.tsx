import { Github } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function AppFooter() {
  // Auto-extract current year for copyright
  const currentYear = new Date().getFullYear();

  // Author information
  const authorName = "George Verouchis";
  const githubUrl = "https://github.com/georgevrs/soundboard-pro";

  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              © {currentYear} {authorName}. {t('footer.rights')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              aria-label="View on GitHub"
            >
              <Github className="w-4 h-4" />
              <span>{t('footer.github')}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
