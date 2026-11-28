import CouponInput from '@/components/CouponInput';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Checkout } from '@/hooks/useCheckout';
import { DeliveryEstimate } from './DeliveryEstimate';

const money = (n: number) => `฿${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Totals with coupon, delivery fee and arrival window — shown from the first step, not only at the end. */
export function CartSummaryBox({ ck }: { ck: Checkout }) {
  const { t } = useLanguage();
  const { c, common } = ck;
  return (
    <div className="bg-white border rounded-2xl p-4 space-y-3">
      <div className="flex justify-between text-sm text-gray-700">
        <span>{c.productSubtotal} ({ck.totalItems} {common.pieces})</span><span className="tabular-nums">{money(ck.totalPrice)}</span>
      </div>
      {ck.addonFeesTotal > 0 && (
        <div className="flex justify-between text-sm text-gray-700">
          <span>{c.giftServiceLines} ({ck.giftLineCount} {c.itemsCount})</span><span className="tabular-nums">+{money(ck.addonFeesTotal)}</span>
        </div>
      )}
      <CouponInput
        items={ck.cartItems.map((i) => ({ printingType: i.printingType, price: i.price, quantity: i.quantity }))}
        appliedCoupon={ck.appliedCoupon}
        onApply={(coupon, discount) => { ck.setAppliedCoupon(coupon); ck.setDiscountAmount(discount); }}
        onClear={() => { ck.setAppliedCoupon(null); ck.setDiscountAmount(0); }}
      />
      {ck.discountAmount > 0 && (
        <div className="flex justify-between text-sm text-green-700">
          <span>{c.discountLabel} ({ck.appliedCoupon?.code})</span><span className="tabular-nums">−{money(ck.discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm text-gray-700">
        <span>{t.ordering.deliveryFee}{ck.deliveryLabel ? ` (${ck.deliveryLabel})` : ''}</span>
        <span className="tabular-nums">{ck.deliveryFee === 0 ? t.ordering.free : money(ck.deliveryFee)}</span>
      </div>
      <div className="flex justify-between items-baseline font-bold pt-3 border-t">
        <span>{c.netTotal}</span><span className="text-2xl text-primary tabular-nums">{money(ck.grandTotal)}</span>
      </div>
      <DeliveryEstimate />
    </div>
  );
}
