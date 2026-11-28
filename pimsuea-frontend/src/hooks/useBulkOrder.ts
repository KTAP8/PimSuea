import { useEffect, useMemo, useRef, useState } from 'react';
import { getBulkQuote, type BulkQuote } from '@/services/api';
import { track } from '@/lib/analytics';

type Args = {
  open: boolean;
  productId: string | undefined;
  colorId: string | null;
  printingType: string;
  sizes: string[];
  defaultSize: string;
  /** Print dimensions per side in cm, from the canvas. */
  getSides: () => Record<string, { w: number; h: number }>;
};

/** Size grid + live bulk quote for the studio order panel. */
export function useBulkOrder({ open, productId, colorId, printingType, sizes, defaultSize, getSides }: Args) {
  const [touched, setTouched] = useState<Record<string, number> | null>(null);
  // Until the user edits it, the grid is "1 × default size" (sizes load after mount).
  const grid = useMemo(() => touched ?? (defaultSize ? { [defaultSize]: 1 } : {}), [touched, defaultSize]);
  const [quote, setQuote] = useState<BulkQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const lines = useMemo(
    () => sizes.map((size) => ({ size, qty: grid[size] ?? 0 })).filter((l) => l.qty > 0),
    [grid, sizes],
  );
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const linesKey = JSON.stringify(lines);

  const setQty = (size: string, qty: number) => {
    setTouched({ ...grid, [size]: Math.max(0, Math.min(5000, Math.round(qty) || 0)) });
  };

  /** Accept the nudge: add the extra shirts to the most-ordered size. */
  const addMore = (n: number) => {
    const biggest = [...lines].sort((a, b) => b.qty - a.qty)[0]?.size ?? defaultSize;
    if (!biggest) return;
    track('tier_nudge_accepted', { add: n, from_qty: totalQty });
    setQty(biggest, (grid[biggest] ?? 0) + n);
  };

  const sides = open ? Object.values(getSides()).filter((d) => d.w > 0 && d.h > 0) : [];
  const sidesKey = JSON.stringify(sides);
  const canQuote = Boolean(open && productId && colorId && totalQty && sides.length);

  useEffect(() => {
    if (!canQuote) return;
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      setLoading(true);
      getBulkQuote({ printingType, productId: productId!, color_id: colorId!, sides, lines })
        .then((q) => {
          if (id !== requestId.current) return;
          setQuote(q);
          if (q.next) track('tier_nudge_shown', { total_qty: q.totalQty, add: q.next.addMore });
        })
        .catch(() => { if (id === requestId.current) setQuote(null); })
        .finally(() => { if (id === requestId.current) setLoading(false); });
    }, 250);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-quote on content changes (keys) only
  }, [canQuote, productId, colorId, printingType, linesKey, sidesKey]);

  // A quote for an older grid is never shown as current.
  const current = canQuote && quote && quote.totalQty === totalQty ? quote : null;

  return { grid, setQty, lines, totalQty, quote: current, loading: canQuote && (loading || !current), addMore };
}
