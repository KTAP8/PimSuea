import { useLocation } from 'react-router-dom';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AccountForm } from '@/components/auth/AccountForm';
import { nextFromLocation } from '@/lib/nextPath';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Register() {
  const { t } = useLanguage();
  const location = useLocation();
  return (
    <AuthPageShell title={t.auth.registerTitle} subtitle={t.account.sheetSubtitle.generic}>
      <AccountForm next={nextFromLocation(location.search)} trigger="register_page" initialMode="signup" />
    </AuthPageShell>
  );
}
