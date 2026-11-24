import type { Language } from '@/i18n/types';
/** Canonical public origin for SEO URLs — never the local/preview origin. */
export const SEO_ORIGIN = 'https://pimsuea.com';

/**
 * Public marketing paths (English at root, Thai mirrored under /th).
 * Single source for App routes, prerendering, sitemap checks, and hreflang.
 */
export const MARKETING_PATHS = [
  '/',
  '/custom-shirts-thailand',
  '/print-on-demand',
  '/pricing',
  '/vs-printful',
  '/custom-shirt-no-minimum',
  '/club-and-gift-shirts',
] as const;

export type MarketingPath = (typeof MARKETING_PATHS)[number];

export const THAI_PREFIX = '/th';

/** Language implied by a URL path: /th and /th/* are Thai, everything else English. */
export function langFromPath(pathname: string): Language {
  return pathname === THAI_PREFIX || pathname.startsWith(`${THAI_PREFIX}/`) ? 'th' : 'en';
}

/** Remove the /th prefix: /th/pricing → /pricing, /th → /. */
export function stripLangPrefix(pathname: string): string {
  if (langFromPath(pathname) === 'en') return pathname || '/';
  const rest = pathname.slice(THAI_PREFIX.length);
  return rest === '' ? '/' : rest;
}

/** Path for a given language: ('/pricing', 'th') → /th/pricing, ('/', 'th') → /th. */
export function localizedPath(path: string, lang: Language): string {
  const base = stripLangPrefix(path.startsWith('/') ? path : `/${path}`);
  if (lang === 'en') return base;
  if (base === '/') return THAI_PREFIX;
  if (base.startsWith('/#')) return `${THAI_PREFIX}${base.slice(1)}`;
  return `${THAI_PREFIX}${base}`;
}

/** Absolute marketing URL for a path in a language. */
export function localizedUrl(path: string, lang: Language): string {
  const p = localizedPath(path, lang);
  return `${SEO_ORIGIN}${p === '/' ? '/' : p}`;
}

/** Every prerendered URL path (both languages). */
export function allMarketingUrlPaths(): string[] {
  return MARKETING_PATHS.flatMap((p) => [localizedPath(p, 'en'), localizedPath(p, 'th')]);
}
