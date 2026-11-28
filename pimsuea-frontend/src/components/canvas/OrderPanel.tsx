import { Loader2, ShoppingCart, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { isLegacyDtfPrintingType } from '@/constants/printing';
import { dtfDiscontinuedMessage } from '@/translations/app/checkout';
import type { Color } from '@/types/api';
import type { BulkQuote } from '@/services/api';
import { SizeQuantityGrid } from './SizeQuantityGrid';
import { BulkPriceSummary } from './BulkPriceSummary';

interface Props {
  sizes: string[];
  grid: Record<string, number>;
  onQtyChange: (size: string, qty: number) => void;
  totalQty: number;
  quote: BulkQuote | null;
  quoteLoading: boolean;
  onAddMore: (n: number) => void;
  colors: Color[];
  colorId: string | null;
  onColorChange: (id: string) => void;
  isAddingToCart: boolean;
  isSaving: boolean;
  cartErrorMessage?: string | null;
  onAddToCart: () => void | Promise<void>;
  onOrderNow: () => void | Promise<void>;
  onClose: () => void;
  printingType: string;
}

/** Multi-size order: quantity per size, one colour, live bulk price. */
export function OrderPanel(p: Props) {
  const { lang, t } = useLanguage();
  const s = t.studio;
  const o = t.ordering;
  const isDtfLegacy = isLegacyDtfPrintingType(p.printingType);
  const busy = p.isAddingToCart || p.isSaving;
  const disabled = busy || isDtfLegacy || p.totalQty === 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 id="order-title" className="font-bold text-base text-gray-900">{s.orderProduct}</h3>
          <button onClick={p.onClose} aria-label={t.common.close} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4 overflow-y-auto">
          {p.colors.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{o.colour}</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={o.colour}>
                {p.colors.map((c) => (
                  <button key={c.id} type="button" role="radio" aria-checked={p.colorId === c.id} onClick={() => p.onColorChange(c.id)}
                    className={cn('flex items-center gap-2 rounded-full border pl-1.5 pr-3 min-h-9 text-sm', p.colorId === c.id ? 'border-primary bg-primary/5 font-semibold' : 'border-gray-200')}>
                    <span className="h-6 w-6 rounded-full border border-gray-300" style={{ backgroundColor: c.hex_code }} aria-hidden="true" />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{o.sizesTitle}</p>
            <p className="text-xs text-gray-500 mb-2">{o.sizesHint}</p>
            <SizeQuantityGrid sizes={p.sizes} grid={p.grid} onChange={p.onQtyChange} />
          </div>

          <BulkPriceSummary quote={p.quote} loading={p.quoteLoading} totalQty={p.totalQty} onAddMore={p.onAddMore} />

          {p.cartErrorMessage && (
            <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{p.cartErrorMessage}</p>
          )}
          {isDtfLegacy && (
            <p className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">{dtfDiscontinuedMessage(lang)}</p>
          )}

          <div className="flex flex-col gap-2">
            <button onClick={p.onOrderNow} disabled={disabled}
              className="w-full flex items-center justify-center gap-2 min-h-12 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}{s.orderNow}
            </button>
            <button onClick={p.onAddToCart} disabled={disabled}
              className="w-full flex items-center justify-center gap-2 min-h-12 bg-white border border-gray-200 text-gray-800 rounded-2xl text-sm font-bold hover:bg-gray-50 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}{s.addToCart}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 text-center -mt-1">{s.autoSaveBeforeOrder}</p>
        </div>
      </div>
    </div>
  );
}
