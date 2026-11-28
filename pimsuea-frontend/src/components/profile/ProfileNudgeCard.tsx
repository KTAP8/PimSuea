import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useProfileQuestions } from '@/hooks/useProfileQuestions';
import { ProfileQuestions } from './ProfileQuestions';

/** Inline, dismissible. Shown on account pages after the user has got some value — never blocks. */
export function ProfileNudgeCard() {
  const { t } = useLanguage();
  const o = t.onboarding;
  const q = useProfileQuestions();
  if (!q.shouldShow) return null;

  return (
    <section aria-labelledby="profile-nudge-title" className="relative rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 mb-6">
      <button type="button" onClick={q.dismiss} aria-label={o.nudgeDismiss}
        className="absolute right-3 top-3 rounded-full p-1.5 text-gray-500 hover:bg-white">
        <X className="h-4 w-4" />
      </button>
      <h2 id="profile-nudge-title" className="text-base font-bold text-gray-900 pr-8">{o.nudgeTitle}</h2>
      <p className="text-sm text-gray-600 mb-4">{o.nudgeSubtitle}</p>
      <ProfileQuestions q={q} />
      <div className="mt-4 flex gap-2">
        <Button onClick={() => void q.save()} disabled={!q.canSave || q.saving}>{q.saving ? o.saving : o.nudgeSave}</Button>
        <Button variant="ghost" onClick={q.dismiss}>{o.nudgeDismiss}</Button>
      </div>
    </section>
  );
}
