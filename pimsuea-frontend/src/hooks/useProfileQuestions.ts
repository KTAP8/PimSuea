import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getAttribution } from '@/lib/attribution';
import { isAiAssistantSource } from '@/lib/referralSources';
import { track } from '@/lib/analytics';

const DISMISS_KEY = 'pimsuea_profile_nudge_dismissed_at';
const DISMISS_DAYS = 14;

/** One optional step: purpose + how they heard about us (+ AI tool). Replaces the forced 3-step onboarding. */
export function useProfileQuestions() {
  const { user, isGuest, profile, refreshProfile } = useAuth();
  const [purpose, setPurpose] = useState<string | null>(profile?.design_purpose ?? null);
  const [source, setSource] = useState<string | null>(profile?.referral_source ?? null);
  const [aiTool, setAiTool] = useState<string | null>(profile?.referral_detail ?? null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [dismissedRecently] = useState(() => {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      return Date.now() - at < DISMISS_DAYS * 86400000;
    } catch {
      return false;
    }
  });

  const shouldShow = Boolean(user && !isGuest && profile && !profile.onboarding_completed && !dismissedRecently && !done);
  const canSave = purpose !== null && source !== null && (!isAiAssistantSource(source) || aiTool !== null);

  const save = useCallback(async () => {
    if (!user || !canSave) return false;
    setSaving(true);
    const attribution = getAttribution();
    const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
    const { error } = await supabase.from('profiles').update({
      design_purpose: purpose,
      referral_source: source,
      referral_detail: isAiAssistantSource(source) ? aiTool : null,
      onboarding_completed: true,
      ...(fullName && !profile?.first_name ? { full_name: fullName, first_name: fullName.split(' ')[0] } : {}),
      ...(attribution ? { attribution } : {}),
    }).eq('id', user.id);
    setSaving(false);
    if (error) return false;
    track('profile_questions_saved', { purpose, source });
    setDone(true);
    void refreshProfile();
    return true;
  }, [user, canSave, purpose, source, aiTool, profile?.first_name, refreshProfile]);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
    track('profile_questions_dismissed');
    setDone(true);
  }, []);

  return { shouldShow, purpose, setPurpose, source, setSource, aiTool, setAiTool, canSave, save, saving, done, dismiss };
}
