import { X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { CanvasPriceBreakdown } from '@/types/canvas';
import { PriceCard } from './PriceCard';
import { SizeEditor } from './SizeEditor';
import { PrintSizePresets } from './PrintSizePresets';

type Props = {
  priceBreakdown: CanvasPriceBreakdown | null;
  priceLoading: boolean;
  displaySizeIn: { w: number; h: number } | null;
  printableIn: { w: number; h: number };
  onApplySize: (w: number, h: number) => void;
  onApplyPreset: (w: number, h: number) => void;
  onClose: () => void;
};

export function MobilePriceSheet(p: Props) {
  const { t } = useLanguage();
  const s = t.studio;
  return (
    <div className="fixed inset-x-0 bottom-studio-offset z-50 md:hidden px-4">
      <div className="bg-white rounded-2xl shadow-xl border p-4 space-y-4 max-h-[50dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{s.priceAndSize}</h3>
          <button onClick={p.onClose} aria-label={t.common.close} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <PriceCard priceBreakdown={p.priceBreakdown} priceLoading={p.priceLoading} />
        {p.displaySizeIn ? (
          <div className="space-y-2">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{s.designSizeInches}</p>
            <SizeEditor displaySizeIn={p.displaySizeIn} onApply={p.onApplySize} />
            <PrintSizePresets sizeIn={p.displaySizeIn} printable={p.printableIn} onApply={p.onApplyPreset} />
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-2">{s.selectDesignToResize}</p>
        )}
      </div>
    </div>
  );
}
