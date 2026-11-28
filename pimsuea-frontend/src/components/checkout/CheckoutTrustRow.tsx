import { Lock, MessageCircle, Shirt } from 'lucide-react';
import { TRUST_STATS } from '@/content/geoFacts';
import { useLanguage } from '@/i18n/LanguageContext';
import { lineAddFriendUrl } from '@/lib/line';

/** Reassurance next to "Pay": Stripe, accepted methods, English LINE support (allowed claim). */
export function CheckoutTrustRow() {
  const { t } = useLanguage();
  const o = t.ordering;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" aria-hidden="true" />{o.securePayment} · PromptPay · Visa · Mastercard</span>
        <span className="flex items-center gap-1.5"><Shirt className="h-3.5 w-3.5" aria-hidden="true" />{o.shirtsPrinted.replace('{n}', String(TRUST_STATS.shirtsPrinted))}</span>
      </span>
      <a href={lineAddFriendUrl()} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-medium text-primary hover:underline">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />{o.lineSupport}
      </a>
    </div>
  );
}
