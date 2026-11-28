import { Loader2, Sparkles, TrendingDown, Users } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { BulkQuote } from '@/services/api';

type Props = { quote: BulkQuote | null; loading: boolean; totalQty: number; onAddMore: (n: number) => void };

const thb = (n: number) => `฿${Math.round(n).toLocaleString('en-US')}`;

/** "฿X/shirt · ฿Y total" + the next-tier nudge. */
export function BulkPriceSummary({ quote, loading, totalQty, onAddMore }: Props) {
  const { t } = useLanguage();
  const o = t.ordering;
  if (!totalQty) return <p className="text-sm text-gray-500 text-center py-2">{o.noQuantity}</p>;

  return (
    <div className="rounded-2xl bg-gray-50 p-4 space-y-3" aria-live="polite">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{totalQty === 1 ? o.totalShirt : o.totalShirts.replace('{n}', String(totalQty))}</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {quote ? thb(quote.avgUnit) : '—'}<span className="text-sm font-medium text-gray-500">{o.perShirt}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{o.total}</p>
          <p className="text-lg font-bold text-gray-900 tabular-nums flex items-center gap-1.5 justify-end">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" aria-label={o.quoteLoading} />}
            {quote ? thb(quote.total) : '—'}
          </p>
        </div>
      </div>

      {quote?.next ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <TrendingDown className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          <p className="flex-1 text-xs text-amber-900">
            <span className="font-semibold">{o.nudge.replace('{n}', String(quote.next.addMore)).replace('{price}', thb(quote.next.avgUnit))}</span>
            {' · '}{o.nudgeSave.replace('{amount}', thb(quote.next.savingPerShirt))}
          </p>
          <button type="button" onClick={() => onAddMore(quote.next!.addMore)}
            className="shrink-0 rounded-lg bg-amber-600 px-2.5 min-h-8 text-xs font-bold text-white hover:bg-amber-700">
            {o.nudgeAdd.replace('{n}', String(quote.next.addMore))}
          </button>
        </div>
      ) : quote && totalQty >= 12 ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-green-800"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />{o.bulkBest}</p>
      ) : null}
      {totalQty >= 12 && (
        <p className="flex items-center gap-1.5 text-xs text-gray-600"><Users className="h-3.5 w-3.5" aria-hidden="true" />{o.bulkSocial}</p>
      )}
    </div>
  );
}
