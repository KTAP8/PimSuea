import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from './LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
      className={cn(
        'flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer',
        compact
          ? 'px-2 py-1.5 rounded-lg'
          : 'px-2.5 py-1.5 rounded-lg border border-border/80 bg-card hover:bg-secondary/50',
        className,
      )}
      aria-label={t.common.toggleLanguage}
    >
      <Globe className={cn('text-primary', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      <span>{lang === 'en' ? t.common.switchToThai : t.common.switchToEnglish}</span>
    </button>
  );
}
