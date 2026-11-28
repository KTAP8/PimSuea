import { supabase } from '@/lib/supabase';
import type { ShippingInfo } from '@/lib/checkoutCart';

/** Checkout progress for this tab (survives the Stripe redirect + "back"). */
const KEY = 'pimsuea_checkout_v1';
type Saved = { step: number; shipping: ShippingInfo };

export function readCheckoutSession(): Saved | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

export function writeCheckoutSession(data: Saved): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode */ }
}

export function clearCheckoutSession(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Last address used for a paid checkout (profiles.default_shipping). Null if none / not migrated. */
export async function loadDefaultShipping(): Promise<Partial<ShippingInfo> | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from('profiles').select('default_shipping').eq('id', auth.user.id).maybeSingle();
  if (error || !data?.default_shipping) return null;
  return data.default_shipping as Partial<ShippingInfo>;
}

/** Saves the address + the language emails should use (needs the redesign migration; no-op before). */
export async function saveDefaultShipping(shipping: ShippingInfo, locale: 'en' | 'th'): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('profiles').update({ default_shipping: shipping, locale }).eq('id', auth.user.id);
}
