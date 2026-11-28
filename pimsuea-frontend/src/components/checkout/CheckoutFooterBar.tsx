import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Checkout } from '@/hooks/useCheckout';
import { CheckoutTrustRow } from './CheckoutTrustRow';

export function CheckoutFooterBar({ ck }: { ck: Checkout }) {
  const { c, common, step } = ck;
  return (
    <div className="sticky bottom-0 z-20 -mx-4 px-4 py-4 mt-8 space-y-3 bg-slate-50/95 backdrop-blur-sm border-t border-gray-200 pb-safe">
      {step === 3 && <CheckoutTrustRow />}
      <div className="flex justify-between gap-3">
        {step > 1 ? <Button variant="outline" onClick={ck.handleBack} className="min-h-11">{common.back}</Button> : <div />}
        {step < 3 ? (
          <Button onClick={ck.handleNext} disabled={ck.cartItems.length === 0 || ck.hasDtfItems} className="min-h-11">
            {common.continue} <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={ck.handleSubmit} className="bg-green-700 hover:bg-green-800 min-h-11 px-6" disabled={ck.loading || ck.hasDtfItems}>
            {ck.loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
            {c.pay} · ฿{ck.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </Button>
        )}
      </div>
    </div>
  );
}
