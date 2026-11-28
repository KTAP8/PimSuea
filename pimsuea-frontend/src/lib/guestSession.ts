/**
 * Guest studio support.
 *
 * Visitors can design without an account: the first API call that needs a user
 * (upload, save, pricing, cart) lazily creates a Supabase anonymous session.
 * Before the guest signs up / in, `prepareGuestClaim()` stores a signed claim
 * token; after auth, `runGuestClaim()` moves their designs to the real account.
 */
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

const CLAIM_KEY = 'pimsuea_guest_claim';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/** API paths a guest may call; anything else still needs a real account. */
const GUEST_PATHS = /^\/?(uploads|designs|print|pricing|cart)(\/|$|\?)/;

let pending: Promise<Session | null> | null = null;

export const isGuestUser = (user: User | null | undefined): boolean => Boolean(user?.is_anonymous);

export function isGuestCapablePath(url: string | undefined): boolean {
  return Boolean(url && GUEST_PATHS.test(url));
}

/** Returns the current session, creating an anonymous one if there is none. */
export async function ensureSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  if (!pending) {
    pending = supabase.auth.signInAnonymously().then(({ data: d, error }) => {
      pending = null;
      if (error) {
        console.error('[guest] anonymous sign-in failed', error.message);
        return null;
      }
      track('guest_session_started');
      return d.session;
    });
  }
  return pending;
}

async function postWithToken(path: string, token: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });
}

/** Call while still a guest, right before showing / starting sign-up or sign-in. */
export async function prepareGuestClaim(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session || !isGuestUser(session.user)) return getStoredClaim();
  try {
    const res = await postWithToken('/guest/claim-token', session.access_token, {});
    if (!res.ok) return null;
    const { token } = (await res.json()) as { token: string };
    localStorage.setItem(CLAIM_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export function getStoredClaim(): string | null {
  try {
    return localStorage.getItem(CLAIM_KEY);
  } catch {
    return null;
  }
}

/** Adopt a claim token carried in a URL (email confirmation opened on another device). */
export function adoptClaimFromUrl(): void {
  const url = new URL(window.location.href);
  const claim = url.searchParams.get('claim');
  if (!claim) return;
  localStorage.setItem(CLAIM_KEY, claim);
  url.searchParams.delete('claim');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

export type ClaimResult = { from: string; to: string; designs: number; cartItems: number; files: number; alreadyClaimed?: boolean };

let claimInFlight: Promise<ClaimResult | null> | null = null;

/** Run once a permanent session exists. Safe to call repeatedly / concurrently. */
export function runGuestClaim(session: Session): Promise<ClaimResult | null> {
  if (!claimInFlight) {
    claimInFlight = doClaim(session).finally(() => { claimInFlight = null; });
  }
  return claimInFlight;
}

async function doClaim(session: Session): Promise<ClaimResult | null> {
  const token = getStoredClaim();
  if (!token || isGuestUser(session.user)) return null;
  try {
    const res = await postWithToken('/guest/claim', session.access_token, { token });
    localStorage.removeItem(CLAIM_KEY);
    if (!res.ok) return null;
    const result = (await res.json()) as ClaimResult;
    track('guest_claimed', { designs: result.designs, cart_items: result.cartItems });
    return result;
  } catch {
    return null;
  }
}
