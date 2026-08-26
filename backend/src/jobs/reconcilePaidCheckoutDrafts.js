const { supabaseAdmin } = require('../config/supabaseClient');
const { getStripe, sessionMatchesConfiguredStripeMode } = require('../config/stripeClient');
const {
  fulfillDraftById,
  buildStripeMetaFromSession,
} = require('../controllers/paymentController');

/**
 * Safety net: find checkout drafts still pending/expired/stuck in DB but paid
 * in Stripe, then run normal fulfillment so orders are not lost when webhooks fail.
 */
async function reconcilePaidCheckoutDrafts() {
  if (!supabaseAdmin) {
    console.warn('[reconcilePaidCheckoutDrafts] supabaseAdmin not configured — skipping');
    return { fulfilled: 0, skipped: 0, errors: 0 };
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.warn('[reconcilePaidCheckoutDrafts]', err.message);
    return { fulfilled: 0, skipped: 0, errors: 0 };
  }

  const { data: drafts, error } = await supabaseAdmin
    .from('checkout_drafts')
    .select('id, stripe_checkout_session_id, status')
    .in('status', ['pending', 'expired', 'completing'])
    .not('stripe_checkout_session_id', 'is', null)
    .is('order_id', null);

  if (error) {
    console.error('[reconcilePaidCheckoutDrafts] query failed:', error.message);
    return { fulfilled: 0, skipped: 0, errors: 1 };
  }

  let fulfilled = 0;
  let skipped = 0;
  let errors = 0;

  for (const draft of drafts || []) {
    if (!sessionMatchesConfiguredStripeMode(draft.stripe_checkout_session_id)) {
      skipped += 1;
      continue;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(draft.stripe_checkout_session_id);

      if (session.payment_status !== 'paid') {
        skipped += 1;
        continue;
      }

      const result = await fulfillDraftById(
        draft.id,
        buildStripeMetaFromSession(session),
        { allowExpired: true },
      );

      fulfilled += 1;
      console.log(
        '[reconcilePaidCheckoutDrafts] fulfilled draft',
        draft.id,
        'session',
        session.id,
        'order',
        result.orderId,
      );
    } catch (err) {
      errors += 1;
      console.error('[reconcilePaidCheckoutDrafts] draft', draft.id, err.message);
    }
  }

  if (fulfilled > 0 || errors > 0) {
    console.log('[reconcilePaidCheckoutDrafts] done', { fulfilled, skipped, errors });
  }

  return { fulfilled, skipped, errors };
}

function startReconcilePaidCheckoutDraftsJob() {
  const run = () => {
    reconcilePaidCheckoutDrafts().catch((err) => {
      console.error('[reconcilePaidCheckoutDrafts] unhandled error:', err);
    });
  };

  run();
  const oneHour = 60 * 60 * 1000;
  setInterval(run, oneHour);
}

module.exports = { reconcilePaidCheckoutDrafts, startReconcilePaidCheckoutDraftsJob };
