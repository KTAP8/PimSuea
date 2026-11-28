import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAccountAuth, type AuthTrigger } from '@/hooks/useAccountAuth';
import { isValidEmail, passwordValid } from '@/lib/passwordRules';
import { GoogleButton } from './GoogleButton';
import { PasswordField } from './PasswordField';
import { AuthTermsLine } from './AuthTermsLine';
import { CheckInbox } from './CheckInbox';

type Props = { next: string; trigger: AuthTrigger; initialMode?: 'signup' | 'login'; onForgotPassword?: () => void };

/** Google-first sign-up / log-in. Used by Register, Login and the in-studio SignupSheet. */
export function AccountForm({ next, trigger, initialMode = 'signup', onForgotPassword }: Props) {
  const { t } = useLanguage();
  const a = t.account;
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAccountAuth(next, trigger);
  const signup = mode === 'signup';
  const canSubmit = isValidEmail(email) && (signup ? passwordValid(password) : password.length > 0);

  if (auth.sentTo) return <CheckInbox email={auth.sentTo} cooldown={auth.cooldown} onResend={auth.resend} />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (signup) void auth.signUp(email, password);
    else void auth.logIn(email, password);
  };

  return (
    <div className="space-y-4">
      <GoogleButton label={a.continueGoogle} busyLabel={t.auth.connecting} busy={auth.busy === 'google'}
        disabled={auth.busy === 'email'} onClick={auth.google} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center text-xs text-gray-500"><span className="bg-white px-3">{a.orEmail}</span></div>
      </div>

      {auth.error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{a.errors[auth.error]}</span>
          {auth.error === 'alreadyRegistered' && signup && (
            <button type="button" className="ml-auto font-semibold underline" onClick={() => { setMode('login'); auth.setError(null); }}>
              {a.logIn}
            </button>
          )}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="acct-email">{a.email}</Label>
          <Input id="acct-email" type="email" inputMode="email" autoComplete="email" placeholder="name@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        </div>
        <PasswordField id="acct-password" label={a.password} value={password} onChange={setPassword}
          rules={signup ? t.auth.passwordRules : undefined} autoComplete={signup ? 'new-password' : 'current-password'} />
        {!signup && onForgotPassword && (
          <button type="button" onClick={onForgotPassword} className="block ml-auto text-sm text-primary hover:underline">
            {t.auth.forgotPassword}
          </button>
        )}
        <Button type="submit" className="w-full h-11 text-base" disabled={!canSubmit || auth.busy !== null}>
          {auth.busy === 'email' ? (signup ? a.creating : a.loggingIn) : (signup ? a.createAccount : a.logIn)}
        </Button>
      </form>

      <AuthTermsLine />

      <p className="text-center text-sm text-gray-600">
        {signup ? a.haveAccount : a.noAccount}{' '}
        <button type="button" className="font-semibold text-primary hover:underline"
          onClick={() => { setMode(signup ? 'login' : 'signup'); auth.setError(null); }}>
          {signup ? a.logIn : a.createAccount}
        </button>
      </p>
    </div>
  );
}
