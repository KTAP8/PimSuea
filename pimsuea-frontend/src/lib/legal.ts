/**
 * Integer version of the published Terms of Service + Privacy Policy.
 * Bump when either document changes materially (e.g. gift-mode / PDPA).
 * Keep in sync with backend/src/constants/legal.js.
 */
export const CURRENT_TERMS_VERSION = 2;

export const PENDING_TERMS_STORAGE_KEY = 'pimsuea_pending_terms_acceptance';

const PENDING_TTL_MS = 30 * 60 * 1000;

export function markPendingTermsAcceptance() {
  localStorage.setItem(
    PENDING_TERMS_STORAGE_KEY,
    JSON.stringify({ version: CURRENT_TERMS_VERSION, at: Date.now() }),
  );
}

export function takePendingTermsAcceptance(): number | null {
  const raw = localStorage.getItem(PENDING_TERMS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: number; at?: number };
    if (!parsed.at || Date.now() - parsed.at > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_TERMS_STORAGE_KEY);
      return null;
    }
    return parsed.version ?? CURRENT_TERMS_VERSION;
  } catch {
    localStorage.removeItem(PENDING_TERMS_STORAGE_KEY);
    return null;
  }
}

export function clearPendingTermsAcceptance() {
  localStorage.removeItem(PENDING_TERMS_STORAGE_KEY);
}

/** True when this session came from Register → Google (query param) or a fresh pending flag. */
export function shouldRecordSignupConsent(event: string): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('terms_accepted') === '1') return true;
  if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return false;
  return takePendingTermsAcceptance() != null && params.has('code');
}
