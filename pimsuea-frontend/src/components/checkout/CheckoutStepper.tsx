import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = { step: number; labels: [string, string, string] };

export function CheckoutStepper({ step, labels }: Props) {
  return (
    <ol className="flex items-center justify-center mb-8" aria-label="Checkout progress">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <li key={label} className="flex items-center" aria-current={current ? 'step' : undefined}>
            {i > 0 && <span className={cn('w-8 sm:w-12 h-0.5 mx-2 sm:mx-4', step >= n ? 'bg-primary' : 'bg-gray-200')} aria-hidden="true" />}
            <span className={cn('flex items-center gap-1.5', step >= n ? 'text-primary' : 'text-gray-500')}>
              <span className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current shrink-0', done && 'bg-primary text-white border-primary')}>
                {done ? <Check className="w-4 h-4" aria-hidden="true" /> : n}
              </span>
              <span className="hidden sm:inline text-sm font-medium">{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
