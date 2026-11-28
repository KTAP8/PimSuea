import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useProfileQuestions } from '@/hooks/useProfileQuestions';
import { ProfileQuestions } from '@/components/profile/ProfileQuestions';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { nextFromLocation } from '@/lib/nextPath';

/** Optional one-step profile (old links still land here). Never forced by routing any more. */
export default function Onboarding() {
  const { t } = useLanguage();
  const o = t.onboarding;
  const q = useProfileQuestions();
  const navigate = useNavigate();
  const next = nextFromLocation(useLocation().search);

  const finish = async () => {
    if (await q.save()) navigate(next, { replace: true });
  };

  return (
    <AuthPageShell title={o.nudgeTitle} subtitle={o.nudgeSubtitle}>
      <ProfileQuestions q={q} />
      <div className="mt-6 flex gap-2">
        <Button className="flex-1 h-11" onClick={() => void finish()} disabled={!q.canSave || q.saving}>
          {q.saving ? o.saving : o.finish}
        </Button>
        <Button variant="ghost" className="h-11" onClick={() => { q.dismiss(); navigate(next, { replace: true }); }}>
          {o.nudgeDismiss}
        </Button>
      </div>
    </AuthPageShell>
  );
}
