import { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { APP_ORIGIN } from '@/lib/site';
import { authErrorKey, type AuthErrorKey } from '@/lib/authErrors';
import { useLanguage } from '@/i18n/LanguageContext';

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const a = t.auth;
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${APP_ORIGIN}/reset-password` });
    setBusy(false);
    if (err) setError(authErrorKey(err));
    else setSent(true);
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {a.backToLogin}
      </button>
      <div>
        <h2 className="text-xl font-bold text-gray-900">{a.forgotTitle}</h2>
        <p className="text-sm text-gray-600">{a.forgotSubtitle}</p>
      </div>
      {sent ? (
        <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{a.emailSentDesc} <strong>{email}</strong></span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {error && <p role="alert" className="text-sm text-red-700">{t.account.errors[error]}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">{t.account.email}</Label>
            <Input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
          </div>
          <Button type="submit" className="w-full h-11" disabled={busy}>{busy ? a.sending : a.sendResetLink}</Button>
        </form>
      )}
    </div>
  );
}
