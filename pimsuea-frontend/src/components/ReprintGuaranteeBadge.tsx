import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translations, type Language } from '@/translations/landing';

interface Props {
  lang: Language;
  onPolicyClick: () => void;
  className?: string;
}

export function ReprintGuaranteeBadge({ lang, onPolicyClick, className }: Props) {
  const t = translations[lang];

  return (
    <div
      className={cn(
        'inline-flex items-start gap-3.5 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-[0_4px_20px_rgba(8,99,109,0.04)] hover:border-primary/40 transition-all duration-300',
        className,
      )}
    >
      <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 ring-1 ring-primary/20">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="font-bold tracking-tight text-sm md:text-base text-slate-900 leading-snug">
          {t.reprintBadgeHeadline}
        </p>
        <p className="hidden sm:block text-xs text-slate-500 font-normal leading-relaxed">
          {t.reprintBadgeSupport}
        </p>
        <button
          type="button"
          onClick={onPolicyClick}
          className="text-xs text-primary hover:underline font-semibold mt-0.5 inline-block"
        >
          {t.reprintBadgePolicyLink}
        </button>
      </div>
    </div>
  );
}
