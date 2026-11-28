import { Truck } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { deliveryWindow } from '@/lib/deliveryEstimate';

export function DeliveryEstimate() {
  const { t, lang } = useLanguage();
  const o = t.ordering;
  const w = deliveryWindow(lang);
  return (
    <div className="flex items-start gap-2 text-sm">
      <Truck className="h-4 w-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="font-semibold text-gray-900">{o.arrives.replace('{from}', w.from).replace('{to}', w.to)}</p>
        <p className="text-xs text-gray-500">{o.arrivesNote}</p>
      </div>
    </div>
  );
}
