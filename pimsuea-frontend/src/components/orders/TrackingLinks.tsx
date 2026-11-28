import { ExternalLink, Package } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

/** 17TRACK auto-detects Thai carriers (Thailand Post, Flash, Kerry, J&T…). */
const trackUrl = (n: string) => `https://t.17track.net/en#nums=${encodeURIComponent(n)}`;

export function TrackingLinks({ numbers }: { numbers?: string[] }) {
  const { t } = useLanguage();
  const o = t.ordering;
  if (!numbers?.length) return null;
  return (
    <div className="space-y-2">
      {numbers.map((n) => (
        <div key={n} className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm text-gray-600">{o.trackingNumber}</span>
            <span className="font-mono font-semibold truncate">{n}</span>
          </div>
          <a href={trackUrl(n)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline shrink-0">
            {o.track}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      ))}
    </div>
  );
}
