/** Delivery promise — keep in sync with geoFacts ("Typically 5–14 days") and public/llms.txt. */
export const DELIVERY_DAYS = { min: 5, max: 14 } as const;

export function deliveryWindow(lang: 'en' | 'th', from: Date = new Date()): { from: string; to: string } {
  const fmt = new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
  const add = (d: number) => new Date(from.getTime() + d * 86400000);
  return { from: fmt.format(add(DELIVERY_DAYS.min)), to: fmt.format(add(DELIVERY_DAYS.max)) };
}
