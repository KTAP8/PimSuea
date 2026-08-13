/** Production app origin (login, catalog, studio). */
export const APP_ORIGIN =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ?? 'https://app.pimsuea.com';

/** Public marketing site origin. */
export const MARKETING_ORIGIN =
  import.meta.env.VITE_MARKETING_URL?.replace(/\/$/, '') ?? 'https://pimsuea.com';

const APP_HOSTS = new Set(['app.pimsuea.com', 'www.app.pimsuea.com']);
const MARKETING_HOSTS = new Set(['pimsuea.com', 'www.pimsuea.com']);

function currentHostname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
}

/** True on app.pimsuea.com, or localhost in dev (unless VITE_FORCE_MARKETING). */
export function isAppHost(): boolean {
  if (import.meta.env.VITE_FORCE_MARKETING === 'true') return false;
  const host = currentHostname();
  if (APP_HOSTS.has(host)) return true;
  if (import.meta.env.DEV && (host === 'localhost' || host === '127.0.0.1')) return true;
  return false;
}

/** True on pimsuea.com / www (marketing only). */
export function isMarketingHost(): boolean {
  if (import.meta.env.VITE_FORCE_MARKETING === 'true') return true;
  return MARKETING_HOSTS.has(currentHostname());
}

/** Absolute URL on the app subdomain for cross-origin links from marketing. */
export function appUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${APP_ORIGIN}${normalized}`;
}
