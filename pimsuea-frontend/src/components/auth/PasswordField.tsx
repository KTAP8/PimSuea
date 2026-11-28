import { useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_TESTS } from '@/lib/passwordRules';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Show the live rule checklist (sign-up only). */
  rules?: string[];
  autoComplete: 'new-password' | 'current-password';
};

export function PasswordField({ id, label, value, onChange, rules, autoComplete }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 h-11"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {rules && value.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-1">
          {rules.map((rule, i) => {
            const ok = PASSWORD_TESTS[i]?.(value) ?? false;
            return (
              <li key={rule} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-700' : 'text-gray-500'}`}>
                <Check className={`w-3 h-3 shrink-0 ${ok ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true" />
                {rule}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
