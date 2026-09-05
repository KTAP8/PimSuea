import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, type Language } from './types';

function isLanguage(value: string | null | undefined): value is Language {
  return value === 'th' || value === 'en';
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const domain = isLocalhost ? '' : '; domain=.pimsuea.com';
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/${domain}; max-age=${maxAge}; SameSite=Lax`;
}

export function readStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const fromCookie = readCookie(LANGUAGE_COOKIE);
  if (isLanguage(fromCookie)) return fromCookie;

  try {
    const fromStorage = localStorage.getItem(LANGUAGE_COOKIE);
    if (isLanguage(fromStorage)) return fromStorage;
  } catch {
    /* ignore */
  }

  return DEFAULT_LANGUAGE;
}

export function writeStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  writeCookie(LANGUAGE_COOKIE, lang);
  try {
    localStorage.setItem(LANGUAGE_COOKIE, lang);
  } catch {
    /* ignore */
  }
}
