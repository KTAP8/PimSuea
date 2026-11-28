import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import type { SignupTrigger } from '@/components/auth/SignupSheet';

const SAVE_PROMPT_KEY = 'pimsuea_save_prompt_shown';

/**
 * When to ask a guest for an account inside the studio:
 *  - after their first save (dismissible, once per session)
 *  - when they press "Order now" (required — checkout needs an account)
 * Also confirms with a toast when guest work was moved into a new account.
 */
export function useStudioAccountPrompt({ designId }: { designId: string | null }) {
  const { isGuest, lastClaim } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [trigger, setTrigger] = useState<SignupTrigger | null>(null);
  const shownClaim = useRef<typeof lastClaim>(null);

  /** Return here (with the saved design) after auth. */
  const studioNext = (() => {
    const params = new URLSearchParams(location.search);
    if (designId) params.set('designId', designId);
    const q = params.toString();
    return `${location.pathname}${q ? `?${q}` : ''}`;
  })();

  /** Call after the user's own Save click succeeded on a design that had never been saved. */
  const afterFirstSave = useCallback(() => {
    if (!isGuest || sessionStorage.getItem(SAVE_PROMPT_KEY)) return;
    sessionStorage.setItem(SAVE_PROMPT_KEY, '1');
    setTrigger('save');
  }, [isGuest]);

  useEffect(() => {
    if (!lastClaim || shownClaim.current === lastClaim || !lastClaim.designs) return;
    shownClaim.current = lastClaim;
    toast.success(lastClaim.designs > 1
      ? t.account.claimToastMany.replace('{n}', String(lastClaim.designs))
      : t.account.claimToast);
  }, [lastClaim, t]);

  /** After a successful add-to-cart from "Order now". */
  const goToCheckout = useCallback(() => {
    if (isGuest) setTrigger('order');
    else navigate('/checkout');
  }, [isGuest, navigate]);

  return {
    goToCheckout,
    afterFirstSave,
    sheet: {
      open: trigger !== null,
      trigger: trigger ?? 'generic',
      next: trigger === 'order' ? '/checkout' : studioNext,
      onOpenChange: (open: boolean) => { if (!open) setTrigger(null); },
    },
  };
}
