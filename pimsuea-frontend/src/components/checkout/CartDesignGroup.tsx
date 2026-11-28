import { Plus, Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { getProductName } from '@/lib/productName';
import type { Checkout } from '@/hooks/useCheckout';
import type { CartItem } from '@/lib/checkoutCart';
import { CartLineRow } from './CartLineRow';

const BULK_FROM = 12;

type Props = { ck: Checkout; lines: CartItem[] };

/** All sizes of one design in one colour, edited together (the tier is priced on their total). */
export function CartDesignGroup({ ck, lines }: Props) {
  const { t, lang } = useLanguage();
  const o = t.ordering;
  const first = lines[0];
  const qty = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((n, l) => n + l.quantity * l.price, 0);
  const taken = new Set(lines.map((l) => l.size));
  const canAddSize = first.availableSizes.some((s) => !taken.has(s));

  return (
    <section className="bg-white border rounded-2xl p-4 space-y-3" aria-label={first.designName}>
      <div className="flex gap-4 items-start">
        <img src={first.designImage} alt={first.designName} className="w-20 h-20 object-contain bg-gray-50 rounded-lg border shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{first.designName}</h3>
          <p className="text-sm text-gray-500">{getProductName({ name: first.productName, name_en: first.productNameEn }, lang)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`color-${first.id}`}>{o.color}</label>
            <select id={`color-${first.id}`} value={first.color}
              onChange={(e) => lines.forEach((l) => ck.updateItem(l.id, 'color', e.target.value))}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm">
              {first.availableColors.map((c: { id: string; name: string }) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {qty >= BULK_FROM && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">
                <Sparkles className="h-3 w-3" aria-hidden="true" />{o.bulkApplied}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500">{qty === 1 ? o.totalShirt : o.totalShirts.replace('{n}', String(qty))}</p>
          <p className="font-bold text-lg tabular-nums">฿{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="divide-y border-t pt-3">
        {lines.map((item) => <CartLineRow key={item.id} ck={ck} item={item} takenSizes={taken} />)}
      </div>

      {canAddSize && (
        <button type="button" onClick={() => ck.addSizeLine(first.id)}
          className="inline-flex items-center gap-1.5 min-h-10 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/5">
          <Plus className="h-4 w-4" aria-hidden="true" />{o.addSize}
        </button>
      )}
    </section>
  );
}
