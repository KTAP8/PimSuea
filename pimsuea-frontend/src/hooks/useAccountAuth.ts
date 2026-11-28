import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { APP_ORIGIN } from '@/lib/site';
import { CURRENT_TERMS_VERSION, markPendingTermsAcceptance } from '@/lib/legal';
import { prepareGuestClaim } from '@/lib/guestSession';
import { authErrorKey, type AuthErrorKey } from '@/lib/authErrors';
import { track, trackMeta } from '@/lib/analytics';

export type AuthTrigger = 'save' | 'order' | 'cart' | 'generic' | 'register_page' | 'login_page';

const RESEND_COOLDOWN_S = 60;

function withParam(path: string, key: string, value: string | null): string {
  if (!value) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;
}

/**
 * Shared sign-up / log-in actions for the Register + Login pages and the SignupSheet.
 * Every path prepares a guest claim first, so guest designs follow the user.
 */
export function useAccountAuth(next: string, trigger: AuthTrigger) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const google = useCallback(async () => {
    setBusy('google');
    setError(null);
    await prepareGuestClaim();
    markPendingTermsAcceptance(); // continuing = accepting (terms line under the button)
    track('signup_started', { method: 'google', trigger });
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${APP_ORIGIN}${withParam(next, 'terms_accepted', '1')}` },
    });
    if (err) {
      setError(authErrorKey(err));
      setBusy(null);
    }
  }, [next, trigger]);

  const signUp = useCallback(async (email: string, password: string) => {
    setBusy('email');
    setError(null);
    const claim = await prepareGuestClaim();
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${APP_ORIGIN}${withParam(next, 'claim', claim)}`,
        data: { terms_accepted: true, privacy_accepted: true, terms_version: CURRENT_TERMS_VERSION },
      },
    });
    setBusy(null);
    if (err) {
      setError(authErrorKey(err));
      return;
    }
    trackMeta('CompleteRegistration', { method: 'email' });
    track('signup_completed', { method: 'email', trigger });
    if (data.session) {
      navigate(next, { replace: true }); // email confirmation disabled → signed in already
    } else {
      setSentTo(email.trim());
      setCooldown(RESEND_COOLDOWN_S);
    }
  }, [navigate, next, trigger]);

  const logIn = useCallback(async (email: string, password: string) => {
    setBusy('email');
    setError(null);
    await prepareGuestClaim();
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(null);
    if (err) {
      setError(authErrorKey(err));
      return false;
    }
    navigate(next, { replace: true });
    return true;
  }, [navigate, next]);

  const resend = useCallback(async () => {
    if (!sentTo || cooldown > 0) return;
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: sentTo });
    if (err) setError(authErrorKey(err));
    else setCooldown(RESEND_COOLDOWN_S);
  }, [sentTo, cooldown]);

  return { google, signUp, logIn, resend, busy, error, setError, sentTo, cooldown };
}
