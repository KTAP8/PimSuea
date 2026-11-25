import { useState } from 'react';

/** Typical Thai print-shop minimum (low end of the 30–50 pcs range). */
export const SHOP_MINIMUM = 30;
export const DIAL_MAX = 60;

/** Quantity slider state for the "minimum order" comparison. */
export function useQuantityDial(initial = 12) {
  const [qty, setQty] = useState(initial);
  return {
    qty,
    setQty: (n: number) => setQty(Math.min(DIAL_MAX, Math.max(1, Math.round(n)))),
    shopAccepts: qty >= SHOP_MINIMUM,
    shortBy: Math.max(0, SHOP_MINIMUM - qty),
  };
}
