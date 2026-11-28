/**
 * Print price tiers — strict width × height in inches (no rotation), mirrors
 * backend/src/utils/pricing.js getPrintTier and tools/annotate_print.py.
 */
export type PrintTierId = '3x4in' | 'A5' | 'A4' | 'A3';

export const PRINT_TIERS: { id: PrintTierId; label: string; maxW: number; maxH: number }[] = [
  { id: '3x4in', label: '3×4″', maxW: 3, maxH: 4 },
  { id: 'A5', label: 'A5', maxW: 6, maxH: 8 },
  { id: 'A4', label: 'A4', maxW: 8, maxH: 12 },
  { id: 'A3', label: 'A3', maxW: 12, maxH: 16 },
];

/** Shrinks the geometric target so anti-aliased edges stay inside the tier when printed. */
export const TIER_SAFETY_FACTOR = 0.97;

export function tierFor(wIn: number, hIn: number): PrintTierId {
  for (const t of PRINT_TIERS.slice(0, 3)) if (wIn <= t.maxW && hIn <= t.maxH) return t.id;
  return 'A3';
}

/** Largest size with the same aspect ratio that fits the tier (and the printable area). */
export function fitToTier(
  current: { w: number; h: number },
  tier: PrintTierId,
  printable: { w: number; h: number },
): { w: number; h: number } {
  const t = PRINT_TIERS.find((x) => x.id === tier)!;
  const maxW = Math.min(t.maxW, printable.w) * TIER_SAFETY_FACTOR;
  const maxH = Math.min(t.maxH, printable.h) * TIER_SAFETY_FACTOR;
  const scale = Math.min(maxW / current.w, maxH / current.h);
  return { w: current.w * scale, h: current.h * scale };
}
