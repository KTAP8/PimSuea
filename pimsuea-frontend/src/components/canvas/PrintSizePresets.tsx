import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { PRINT_TIERS, fitToTier, tierFor, type PrintTierId } from '@/lib/printTiers';

type Props = {
  sizeIn: { w: number; h: number } | null;
  printable: { w: number; h: number };
  onApply: (w: number, h: number) => void;
};

/** One-tap tier sizes for the selected layer. The active chip = the tier the layer is priced at now. */
export function PrintSizePresets({ sizeIn, printable, onApply }: Props) {
  const { t } = useLanguage();
  const s = t.studioTools;
  if (!sizeIn) return null;
  const current = tierFor(sizeIn.w, sizeIn.h);
  const apply = (id: PrintTierId) => {
    const next = fitToTier(sizeIn, id, printable);
    onApply(next.w, next.h);
  };
  return (
    <div role="group" aria-label={s.presetsLabel} className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm p-1">
      <span className="hidden lg:inline px-1.5 text-[11px] font-semibold text-gray-500">{s.presetsLabel}</span>
      {PRINT_TIERS.map((tier) => (
        <button key={tier.id} type="button" onClick={() => apply(tier.id)} aria-pressed={current === tier.id}
          title={s.presetHint.replace('{tier}', tier.label)}
          className={cn('min-h-9 rounded-lg px-2.5 text-xs font-semibold',
            current === tier.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100')}>
          {tier.label}
        </button>
      ))}
    </div>
  );
}
