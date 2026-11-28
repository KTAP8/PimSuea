import { AlertCircle, CheckCircle2, RotateCw, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { SaveErrorReason } from '@/lib/saveErrors';

type Props = {
  saveStatus: 'idle' | 'saved' | 'error';
  saveError: SaveErrorReason | null;
  cartErrorMessage: string | null;
  onRetry: () => void;
  onOrder: () => void;
};

/** Thin bar under the header: what went wrong + Retry, or "Saved · Order this design". */
export function SaveStatusBar({ saveStatus, saveError, cartErrorMessage, onRetry, onOrder }: Props) {
  const { t } = useLanguage();
  const s = t.studioTools;

  if (saveStatus === 'error' || cartErrorMessage) {
    const msg = saveError ? s.saveErrors[saveError] : cartErrorMessage;
    return (
      <div role="alert" className="shrink-0 flex items-center justify-center gap-3 px-4 py-2 text-xs sm:text-sm text-red-700 bg-red-50 border-b border-red-100">
        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{msg}</span>
        {saveStatus === 'error' && (
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />{s.retry}
          </button>
        )}
      </div>
    );
  }

  if (saveStatus === 'saved') {
    return (
      <div role="status" className="shrink-0 flex items-center justify-center gap-3 px-4 py-2 text-xs sm:text-sm text-green-800 bg-green-50 border-b border-green-100">
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="font-semibold">{s.saved}</span>
        <button type="button" onClick={onOrder} className="inline-flex items-center gap-1 font-semibold text-green-900 underline underline-offset-2">
          <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />{s.orderThisDesign} →
        </button>
      </div>
    );
  }
  return null;
}
