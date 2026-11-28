import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { useUnsubscribe } from '@/hooks/useUnsubscribe';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Unsubscribe() {
  const { t } = useLanguage();
  const a = t.account;
  const state = useUnsubscribe(useLocation().search);
  return (
    <AuthPageShell title={a.unsubTitle}>
      <div className="flex items-start gap-3 text-sm text-gray-700" role="status">
        {state === 'working' && <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden="true" />}
        {state === 'done' && <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0" aria-hidden="true" />}
        {state === 'failed' && <XCircle className="h-5 w-5 text-red-600 shrink-0" aria-hidden="true" />}
        <p>{state === 'working' ? a.unsubWorking : state === 'done' ? a.unsubDone : a.unsubFailed}</p>
      </div>
      <Button asChild variant="outline" className="mt-6 w-full h-11"><Link to="/catalog">{a.unsubBack}</Link></Button>
    </AuthPageShell>
  );
}
