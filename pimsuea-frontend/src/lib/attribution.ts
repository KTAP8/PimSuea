/**
 * First-touch / last-touch marketing attribution.
 *
 * Stored in cookies on `.pimsuea.com` so the touch captured on the marketing
 * host (pimsuea.com) is still readable on the app host (app.pimsuea.com) at
 * signup and checkout. First touch is never overwritten while the cookie lives.
 */

export type Touch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  fbc?: string;
  referrer?: string;
  landing_path?: string;
  lang?: 'en' | 'th';
  ts: string;
};

export type Attribution = { first_touch: Touch | null; last_touch: Touch | null };

const FIRST_COOKIE = 'pimsuea_ft';
const LAST_COOKIE = 'pimsuea_lt';
const MAX_AGE_SEC = 90 * 24 * 60 * 60;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const MAX_VALUE_LEN = 200;

function cookieDomainSuffix(): string {
  const host = window.location.hostname;
  if (!host.endsWith('pimsuea.com')) return '';
  return '; domain=.pimsuea.com';
}

function writeCookie(name: string, touch: Touch): void {
  const value = encodeURIComponent(JSON.stringify(touch));
  document.cookie = `${name}=${value}; path=/${cookieDomainSuffix()}; max-age=${MAX_AGE_SEC}; SameSite=Lax`;
}

function readCookie(name: string): Touch | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as Touch;
  } catch {
    return null;
  }
}

function clip(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, MAX_VALUE_LEN) : undefined;
}

function externalReferrer(): string | undefined {
  const ref = document.referrer;
  if (!ref) return undefined;
  try {
    const host = new URL(ref).hostname;
    if (host === window.location.hostname || host.endsWith('pimsuea.com')) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

/** A touch only counts when it carries a campaign signal or an external referrer. */
function readCurrentTouch(): Touch | null {
  const params = new URLSearchParams(window.location.search);
  const touch: Touch = { ts: new Date().toISOString() };
  for (const key of UTM_KEYS) touch[key] = clip(params.get(key));
  touch.fbclid = clip(params.get('fbclid'));
  if (touch.fbclid) touch.fbc = `fb.1.${Date.now()}.${touch.fbclid}`;
  touch.referrer = externalReferrer();

  const hasSignal = UTM_KEYS.some((k) => touch[k]) || touch.fbclid || touch.referrer;
  if (!hasSignal) return null;

  touch.landing_path = window.location.pathname;
  touch.lang = window.location.pathname.startsWith('/th') ? 'th' : 'en';
  return touch;
}

/** Call once at app boot, before analytics init. Safe to call repeatedly. */
export function captureAttribution(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const touch = readCurrentTouch();
  if (!touch) return;
  if (!readCookie(FIRST_COOKIE)) writeCookie(FIRST_COOKIE, touch);
  writeCookie(LAST_COOKIE, touch);
}

export function getAttribution(): Attribution | null {
  if (typeof document === 'undefined') return null;
  const first_touch = readCookie(FIRST_COOKIE);
  const last_touch = readCookie(LAST_COOKIE);
  if (!first_touch && !last_touch) return null;
  return { first_touch, last_touch };
}

/** Flat props for analytics tools (PostHog super properties / person props). */
export function attributionProps(prefix: 'ft' | 'lt'): Record<string, string> {
  const attr = getAttribution();
  const touch = prefix === 'ft' ? attr?.first_touch : attr?.last_touch;
  if (!touch) return {};
  const out: Record<string, string> = {};
  for (const key of [...UTM_KEYS, 'referrer', 'landing_path'] as const) {
    const v = touch[key];
    if (v) out[`${prefix}_${key}`] = v;
  }
  return out;
}
