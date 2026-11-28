import { useLanguage } from '@/i18n/LanguageContext';
import type { CanvasPriceBreakdown } from '@/types/canvas';

type Props = { priceBreakdown: CanvasPriceBreakdown | null; onOpen: () => void };

/** Mobile: the per-shirt price stays visible over the canvas; tap for the breakdown + sizes. */
export function MobilePriceChip({ priceBreakdown, onOpen }: Props) {
  const { t } = useLanguage();
  if (!priceBreakdown) return null;
  return (
    <button type="button" onClick={onOpen}
      className="md:hidden absolute bottom-3 right-3 z-10 rounded-full bg-white/95 backdrop-blur border border-gray-200 shadow-md px-3.5 min-h-10 text-sm font-bold text-gray-900">
      ฿{priceBreakdown.total_per_unit.toLocaleString()}
      <span className="ml-1 text-xs font-medium text-gray-500">{t.studio.totalPerPiece}</span>
    </button>
  );
}
