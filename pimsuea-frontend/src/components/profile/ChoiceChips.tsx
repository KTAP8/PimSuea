import { cn } from '@/lib/utils';

type Option = { value: string; label: string; hint?: string };
type Props = { options: Option[]; value: string | null; onChange: (v: string) => void; label: string };

/** Single-select chip group (radio semantics). */
export function ChoiceChips({ options, value, onChange, label }: Props) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-10 rounded-full border px-3.5 text-sm transition-colors',
              active ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
