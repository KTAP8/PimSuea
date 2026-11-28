import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

const STEPS = ['paid_processing', 'printing', 'shipped', 'delivered'] as const;

/** Paid → Printing → Shipped → Delivered. Cancelled / pending orders don't show a timeline. */
export function OrderTimeline({ status }: { status: string }) {
  const { t } = useLanguage();
  const o = t.ordering;
  const idx = STEPS.indexOf(status as (typeof STEPS)[number]);
  if (idx < 0) return null;
  const labels = [o.timelinePaid, o.timelinePrinting, o.timelineShipped, o.timelineDelivered];
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Order progress">
      {labels.map((label, i) => {
        const done = i <= idx;
        return (
          <li key={label} className="flex flex-col items-center text-center gap-1.5" aria-current={i === idx ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', i === 0 ? 'invisible' : done ? 'bg-primary' : 'bg-gray-200')} aria-hidden="true" />
              <span className={cn('h-7 w-7 rounded-full flex items-center justify-center border-2 shrink-0',
                done ? 'bg-primary border-primary text-white' : 'border-gray-300 text-gray-400')}>
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="text-[11px] font-bold">{i + 1}</span>}
              </span>
              <span className={cn('h-0.5 flex-1', i === labels.length - 1 ? 'invisible' : i < idx ? 'bg-primary' : 'bg-gray-200')} aria-hidden="true" />
            </div>
            <span className={cn('text-xs', done ? 'font-semibold text-gray-900' : 'text-gray-500')}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
