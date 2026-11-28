import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  notice: { type: 'success' | 'error'; title: string; message: string } | null;
  dismissLabel: string;
  onDismiss: () => void;
};

/** Errors stay until dismissed (they used to vanish after 3 s, mid-read). */
export function CheckoutNotice({ notice, dismissLabel, onDismiss }: Props) {
  if (!notice) return null;
  const error = notice.type === 'error';
  return (
    <div role={error ? 'alert' : 'status'}
      className={cn('mb-6 flex items-start gap-3 rounded-xl border p-4', error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800')}>
      {error ? <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />}
      <div className="flex-1">
        <p className="font-semibold">{notice.title}</p>
        <p className="text-sm">{notice.message}</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label={dismissLabel} className="rounded-full p-1 hover:bg-white/60">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
