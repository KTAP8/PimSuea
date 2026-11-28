import { useLanguage } from '@/i18n/LanguageContext';
import { AI_ASSISTANT_TOOLS, REFERRAL_SOURCES, isAiAssistantSource } from '@/lib/referralSources';
import type { useProfileQuestions } from '@/hooks/useProfileQuestions';
import { ChoiceChips } from './ChoiceChips';

const PURPOSES = ['university_club', 'company_team', 'own_brand', 'personal'] as const;

type Props = { q: ReturnType<typeof useProfileQuestions> };

export function ProfileQuestions({ q }: Props) {
  const { t } = useLanguage();
  const o = t.onboarding;
  const referralLabel = (v: string) => (o.referral as Record<string, string>)[v] ?? v;
  const aiLabel = (v: string) => (o.aiTools as Record<string, string>)[v] ?? v;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">{o.nudgePurpose}</p>
        <ChoiceChips label={o.nudgePurpose} value={q.purpose} onChange={q.setPurpose}
          options={PURPOSES.map((p) => ({ value: p, label: o.purposes[p].label, hint: o.purposes[p].desc }))} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">{o.nudgeSource}</p>
        <ChoiceChips label={o.nudgeSource} value={q.source} onChange={q.setSource}
          options={REFERRAL_SOURCES.map((r) => ({ value: r.value, label: referralLabel(r.value) }))} />
      </div>
      {isAiAssistantSource(q.source) && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">{o.whichAiTool}</p>
          <ChoiceChips label={o.whichAiTool} value={q.aiTool} onChange={q.setAiTool}
            options={AI_ASSISTANT_TOOLS.map((a) => ({ value: a.value, label: aiLabel(a.value) }))} />
        </div>
      )}
    </div>
  );
}
