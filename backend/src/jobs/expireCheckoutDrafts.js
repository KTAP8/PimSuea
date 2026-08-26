const { supabaseAdmin } = require('../config/supabaseClient');
const { getStripe } = require('../config/stripeClient');

async function expireCheckoutDrafts() {
  if (!supabaseAdmin) return;

  const now = new Date().toISOString();
  const { data: drafts, error } = await supabaseAdmin
    .from('checkout_drafts')
    .select('id, stripe_checkout_session_id')
    .eq('status', 'pending')
    .lt('expires_at', now);

  if (error) {
    console.error('[expireCheckoutDrafts]', error.message);
    return;
  }

  if (!drafts?.length) return;

  let stripe = null;
  try {
    stripe = getStripe();
  } catch {
    // Stripe unavailable — fall back to expiring all overdue pending drafts.
  }

  const toExpire = [];

  for (const draft of drafts) {
    if (!stripe || !draft.stripe_checkout_session_id) {
      toExpire.push(draft.id);
      continue;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(draft.stripe_checkout_session_id);
      if (session.payment_status === 'paid') {
        console.warn('[expireCheckoutDrafts] skipping paid draft', draft.id, 'session', session.id);
        continue;
      }
    } catch (err) {
      console.warn('[expireCheckoutDrafts] could not verify session for draft', draft.id, err.message);
    }

    toExpire.push(draft.id);
  }

  if (toExpire.length === 0) return;

  const { error: updateErr } = await supabaseAdmin
    .from('checkout_drafts')
    .update({ status: 'expired', updated_at: now })
    .in('id', toExpire)
    .eq('status', 'pending');

  if (updateErr) {
    console.error('[expireCheckoutDrafts]', updateErr.message);
  }
}

module.exports = { expireCheckoutDrafts };
