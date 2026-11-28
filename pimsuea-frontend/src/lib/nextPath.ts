/** Where to send someone after login / signup. Only same-origin app paths are allowed. */
export const DEFAULT_NEXT = '/catalog';

export function safeNextPath(raw: string | null | undefined, fallback = DEFAULT_NEXT): string {
  if (!raw) return fallback;
  let path = raw;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  // Reject protocol-relative / absolute URLs and auth pages (avoid loops).
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return fallback;
  if (/^\/(login|register|reset-password)(\/|\?|$)/.test(path)) return fallback;
  return path;
}

export function nextFromLocation(search: string, fallback = DEFAULT_NEXT): string {
  return safeNextPath(new URLSearchParams(search).get('next'), fallback);
}

export function withNext(authPath: '/login' | '/register', next: string): string {
  return `${authPath}?next=${encodeURIComponent(next)}`;
}
