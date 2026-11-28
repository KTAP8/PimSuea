import type { SerializableImage } from '@/types/canvas';

/**
 * Local studio drafts: the canvas is kept on this device as the user works, so
 * leaving (or a crash / tab close) never loses a design. Server save stays the
 * source of truth once the user saves.
 */
export type StudioDraft = {
  v: 1;
  productId: string;
  designId: string | null;
  designName: string;
  activeSide: string;
  colorIds: string[];
  sides: Record<string, SerializableImage[]>;
  savedAt: number;
};

const PREFIX = 'pimsuea_draft_';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const key = (productId: string, designId: string | null) => `${PREFIX}${productId}_${designId ?? 'new'}`;

export function readDraft(productId: string, designId: string | null): StudioDraft | null {
  try {
    const raw = localStorage.getItem(key(productId, designId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as StudioDraft;
    if (draft.v !== 1 || Date.now() - draft.savedAt > MAX_AGE_MS) return null;
    const layers = Object.values(draft.sides).reduce((n, s) => n + s.length, 0);
    return layers > 0 ? draft : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: Omit<StudioDraft, 'v' | 'savedAt'>): void {
  try {
    localStorage.setItem(key(draft.productId, draft.designId), JSON.stringify({ ...draft, v: 1, savedAt: Date.now() }));
  } catch {
    /* quota / private mode — drafts are best effort */
  }
}

export function clearDraft(productId: string, designId: string | null): void {
  try {
    localStorage.removeItem(key(productId, designId));
    if (designId) localStorage.removeItem(key(productId, null));
  } catch {
    /* ignore */
  }
}
