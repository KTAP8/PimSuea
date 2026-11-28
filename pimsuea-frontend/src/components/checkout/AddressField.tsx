import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options?: string[];
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
};

/** Labelled input with inline error and optional suggestions (native datalist — keyboard + screen-reader friendly). */
export function AddressField({ id, label, required, value, error, onChange, onBlur, options, placeholder, inputMode, autoComplete }: Props) {
  const listId = options?.length ? `${id}-list` : undefined;
  return (
    <div>
      <Label htmlFor={id}>{label}{required && <span className="text-red-600"> *</span>}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} list={listId}
        placeholder={placeholder} inputMode={inputMode} autoComplete={autoComplete}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined}
        className={`h-11 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`} />
      {listId && <datalist id={listId}>{options!.map((o) => <option key={o} value={o} />)}</datalist>}
      {error && <p id={`${id}-err`} className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
