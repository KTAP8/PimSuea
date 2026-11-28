import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AccountForm } from '@/components/auth/AccountForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { nextFromLocation } from '@/lib/nextPath';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Login() {
  const { t } = useLanguage();
  const location = useLocation();
  const [forgot, setForgot] = useState(false);
  return (
    <AuthPageShell title={t.auth.loginTitle} subtitle={forgot ? undefined : t.auth.loginSubtitle}>
      {forgot
        ? <ForgotPasswordForm onBack={() => setForgot(false)} />
        : <AccountForm next={nextFromLocation(location.search, '/dashboard')} trigger="login_page" initialMode="login"
            onForgotPassword={() => setForgot(true)} />}
    </AuthPageShell>
  );
}
