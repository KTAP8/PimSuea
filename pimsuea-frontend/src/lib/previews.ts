import { r2ProxyUrl } from '@/services/api';

export type PreviewMap = Record<string, string>;

/** Parse preview field (JSON map, plain URL, or object) into color → URL map. */
export function parsePreviewUrls(raw: string | PreviewMap | null | undefined): PreviewMap {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.fromEntries(
      Object.entries(raw).filter(([, v]) => typeof v === 'string'),
    ) as PreviewMap;
  }
  if (typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => typeof v === 'string'),
      ) as PreviewMap;
    }
  } catch { /* plain URL */ }
  return { __legacy: raw };
}

function pickFromMap(map: PreviewMap, colorId?: string): string {
  if (!map || Object.keys(map).length === 0) return '';
  if (colorId && map[colorId]) return map[colorId];
  if (map.__legacy) return map.__legacy;
  return Object.values(map)[0] ?? '';
}

/** Resolve color-specific preview URL and proxy for R2 display. */
export function resolvePreviewDisplayUrl(
  raw: string | PreviewMap | null | undefined,
  colorId?: string,
  fallback?: string | PreviewMap | null | undefined,
): string {
  let url = pickFromMap(parsePreviewUrls(raw), colorId);
  if (!url && fallback != null) {
    url = pickFromMap(
      typeof fallback === 'object' ? fallback : parsePreviewUrls(fallback),
      colorId,
    );
  }
  return url ? r2ProxyUrl(url) : '';
}

/** Extract first preview URL from JSON map or plain string. */
export function getFirstPreview(raw: string | PreviewMap | null | undefined): string {
  return pickFromMap(parsePreviewUrls(raw));
}

/** First preview URL, proxied for R2 CORS when needed. */
export function getPreviewDisplayUrl(raw: string | PreviewMap | null | undefined): string {
  const url = getFirstPreview(raw);
  return url ? r2ProxyUrl(url) : '';
}
