import { Minus, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { EMPTY_GIFT_RECIPIENT } from '@/types/gift';
import type { Checkout } from '@/hooks/useCheckout';
import type { CartItem } from '@/lib/checkoutCart';
import { GiftServiceLineOption } from './GiftServiceLineOption';

type Props = { ck: Checkout; item: CartItem; takenSizes: Set<string> };

/** One size line inside a design group: size, quantity stepper, line total, gift option, remove. */
export function CartLineRow({ ck, item, takenSizes }: Props) {
  const { t } = useLanguage();
  const o = t.ordering;
  const setQty = (q: number) => ck.updateItem(item.id, 'quantity', Math.max(1, Math.min(5000, q || 1)));
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor={`size-${item.id}`}>{o.size}</label>
        <select id={`size-${item.id}`} value={item.size} onChange={(e) => ck.updateItem(item.id, 'size', e.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm font-semibold">
          {item.availableSizes.map((s) => (
            <option key={s} value={s} disabled={s !== item.size && takenSizes.has(s)}>{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-1" role="group" aria-label={o.quantity}>
          <button type="button" onClick={() => setQty(item.quantity - 1)} disabled={item.quantity <= 1} aria-label={o.decrease.replace('{size}', item.size)}
            className="h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><Minus className="h-4 w-4" /></button>
          <input type="number" inputMode="numeric" min={1} value={item.quantity} onChange={(e) => setQty(parseInt(e.target.value, 10))}
            aria-label={o.qtyFor.replace('{size}', item.size)}
            className="h-10 w-14 rounded-lg border border-gray-200 text-center text-sm font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
          <button type="button" onClick={() => setQty(item.quantity + 1)} aria-label={o.increase.replace('{size}', item.size)}
            className="h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="ml-auto text-right">
          <p className="font-bold tabular-nums">฿{(item.price * item.quantity).toLocaleString()}</p>
          <p className="text-xs text-gray-500 tabular-nums">฿{item.price.toLocaleString()} {t.common.perPiece}</p>
        </div>
        <button type="button" onClick={() => ck.removeItem(item.id)} aria-label={t.common.delete}
          className="h-10 w-10 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-2">
        <GiftServiceLineOption
          enabled={Boolean(item.is_gift)}
          onEnabledChange={(enabled) => ck.updateGiftFields(item.id, {
            is_gift: enabled,
            gift_recipient: enabled ? (item.gift_recipient ?? { ...EMPTY_GIFT_RECIPIENT }) : item.gift_recipient,
          })}
          message={item.gift_message ?? ''}
          onMessageChange={(gift_message) => ck.updateGiftFields(item.id, { gift_message })}
          recipient={item.gift_recipient ?? EMPTY_GIFT_RECIPIENT}
          onRecipientChange={(gift_recipient) => ck.updateGiftFields(item.id, { gift_recipient })}
          addonPrice={ck.giftAddon?.price_thb ?? null}
          addonAvailable={Boolean(ck.giftAddon)}
          addonName={ck.giftAddon?.name}
          validateKey={ck.giftValidateKeys[item.id] ?? 0}
        />
      </div>
    </div>
  );
}
