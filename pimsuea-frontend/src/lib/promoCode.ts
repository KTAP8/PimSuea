/** Shared HOLIDAY20 promo — cookie handoff from marketing → app checkout. */

export const HOLIDAY_PROMO_CODE = 'HOLIDAY20';
export const HOLIDAY_PROMO_COOKIE = 'pimsuea_promo_code';
export const HOLIDAY_POPUP_SEEN_KEY = 'holiday20_popup_seen';

/** Same instant as coupons.expires_at: Wed 10 Dec 2026, 23:59 Bangkok. */
export const HOLIDAY_PROMO_EXPIRES_AT = new Date('2026-12-10T17:00:00.000Z');

export function isHolidayPromoLive(now: Date = new Date()): boolean {
  return now < HOLIDAY_PROMO_EXPIRES_AT;
}

function cookieDomainSuffix(): string {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return '';
  return '; domain=.pimsuea.com';
}

function maxAgeUntilExpirySeconds(now: Date = new Date()): number {
  return Math.max(0, Math.floor((HOLIDAY_PROMO_EXPIRES_AT.getTime() - now.getTime()) / 1000));
}

export function writePromoCookie(code: string = HOLIDAY_PROMO_CODE): void {
  if (typeof document === 'undefined' || !isHolidayPromoLive()) return;
  const maxAge = maxAgeUntilExpirySeconds();
  if (maxAge <= 0) return;
  document.cookie = `${HOLIDAY_PROMO_COOKIE}=${encodeURIComponent(code)}; path=/${cookieDomainSuffix()}; max-age=${maxAge}; SameSite=Lax`;
}

export function readPromoCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${HOLIDAY_PROMO_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]).trim().toUpperCase() : '';
  return value || null;
}

export function clearPromoCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${HOLIDAY_PROMO_COOKIE}=; path=/${cookieDomainSuffix()}; max-age=0; SameSite=Lax`;
}

export function readPendingPromoCode(): string | null {
  if (!isHolidayPromoLive()) return null;
  if (typeof window === 'undefined') return null;
  const fromQuery = new URLSearchParams(window.location.search).get('coupon')?.trim().toUpperCase();
  if (fromQuery) return fromQuery;
  return readPromoCookie();
}

export function hasSeenHolidayPopupThisSession(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(HOLIDAY_POPUP_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHolidayPopupSeen(): void {
  try {
    sessionStorage.setItem(HOLIDAY_POPUP_SEEN_KEY, '1');
  } catch {
    /* private mode */
  }
}
