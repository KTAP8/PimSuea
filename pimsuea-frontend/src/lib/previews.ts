import { r2ProxyUrl } from '@/services/api';

/** Extract first preview URL from JSON map or plain string. */
export function getFirstPreview(raw: string | null | undefined): string {
  if (!raw) return '';
  if (typeof raw === 'object') {
    const first = Object.values(raw as Record<string, unknown>)[0];
    return typeof first === 'string' ? first : '';
  }
  try {
    const m = JSON.parse(raw);
    if (m && typeof m === 'object' && !Array.isArray(m)) {
      const first = Object.values(m)[0];
      if (typeof first === 'string') return first;
    }
  } catch { /* not JSON */ }
  return raw;
}

/** First preview URL, proxied for R2 CORS when needed. */
export function getPreviewDisplayUrl(raw: string | null | undefined): string {
  const url = getFirstPreview(raw);
  return url ? r2ProxyUrl(url) : '';
}
