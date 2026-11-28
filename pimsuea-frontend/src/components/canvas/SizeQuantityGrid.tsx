import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

type Props = { sizes: string[]; grid: Record<string, number>; onChange: (size: string, qty: number) => void };

/** One stepper per size. Typing a number works too (bulk orders). */
export function SizeQuantityGrid({ sizes, grid, onChange }: Props) {
  const { t } = useLanguage();
  const o = t.ordering;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {sizes.map((size) => {
        const qty = grid[size] ?? 0;
        return (
          <div key={size} className={cn('flex items-center justify-between rounded-xl border px-2 py-1.5', qty > 0 ? 'border-primary bg-primary/5' : 'border-gray-200')}>
            <span className="w-9 text-sm font-bold text-gray-900">{size}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onChange(size, qty - 1)} disabled={qty <= 0} aria-label={o.decrease.replace('{size}', size)}
                className="h-8 w-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 disabled:opacity-30">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input type="number" inputMode="numeric" min={0} value={qty || ''} placeholder="0"
                onChange={(e) => onChange(size, Number(e.target.value))} aria-label={o.qtyFor.replace('{size}', size)}
                className="h-8 w-10 rounded-lg border border-gray-200 text-center text-sm font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
              <button type="button" onClick={() => onChange(size, qty + 1)} aria-label={o.increase.replace('{size}', size)}
                className="h-8 w-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
