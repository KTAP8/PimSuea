import { Check } from 'lucide-react';
import { CheckoutReprintGuarantee } from '@/components/CheckoutReprintGuarantee';
import type { Checkout } from '@/hooks/useCheckout';
import { CartSummaryBox } from './CartSummaryBox';

export function SummaryStep({ ck }: { ck: Checkout }) {
  const { c, common, lang, shippingInfo: s, giftAddon } = ck;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center"><Check className="mr-2" aria-hidden="true" /> {c.reviewOrder}</h2>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4">
          <section className="bg-white p-5 rounded-2xl border space-y-3" aria-labelledby="sum-items">
            <h3 id="sum-items" className="font-semibold border-b pb-2">{c.orderSummary}</h3>
            {ck.cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                <img src={item.designImage} alt="" className="w-12 h-12 object-contain bg-gray-50 rounded border shrink-0" />
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-medium truncate">{item.designName}</p>
                  <p className="text-gray-500">{item.size} · {item.color} · ×{item.quantity}
                    {item.is_gift && <span className="ml-1 text-primary font-semibold">🎁 {c.giftBadge}{giftAddon ? ` +฿${giftAddon.price_thb}` : ''}</span>}
                  </p>
                  {item.is_gift && item.gift_recipient?.fullName && <p className="text-xs text-gray-500">{c.sendTo}: {item.gift_recipient.fullName}</p>}
                </div>
                <span className="text-sm font-semibold tabular-nums">฿{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </section>

          <section className="bg-white p-5 rounded-2xl border" aria-labelledby="sum-ship">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <h3 id="sum-ship" className="font-semibold">{c.shippingAddressTitle}</h3>
              <button type="button" onClick={ck.handleBack} className="text-sm font-semibold text-primary hover:underline">{common.edit}</button>
            </div>
            <p className="text-sm">{s.fullName} · {s.phone}</p>
            <p className="text-sm text-gray-700">{[s.addressLine1, s.addressLine2, s.district, s.province, s.postalCode].filter(Boolean).join(', ')}</p>
          </section>

          <section className="bg-white p-5 rounded-2xl border space-y-3" aria-labelledby="sum-preview">
            <h3 id="sum-preview" className="font-semibold">{c.previewSectionTitle}</h3>
            <p className="text-sm text-gray-600">{c.previewSectionDesc}</p>
            <CheckoutReprintGuarantee onPolicyClick={ck.openReprintPolicy} locale={lang} />
          </section>
        </div>
        <div className="lg:sticky lg:top-6"><CartSummaryBox ck={ck} /></div>
      </div>
    </div>
  );
}
