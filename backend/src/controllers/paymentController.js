const { supabaseAdmin } = require('../config/supabaseClient');
const {
  getStripe,
  getPendingOrderTtlHours,
  getFrontendUrl,
  thbToStripeAmount,
} = require('../config/stripeClient');
const {
  CartValidationError,
  validateAndPriceCart,
  fulfillOrder,
} = require('../services/orderFulfillment');

function mapPaymentMethod(session) {
  const types = session.payment_method_types || [];
  if (types.includes('promptpay')) return 'stripe_promptpay';
  if (types.includes('card')) return 'stripe_card';
  const pmType = session.payment_method_details?.type;
  if (pmType === 'promptpay') return 'stripe_promptpay';
  if (pmType === 'card') return 'stripe_card';
  return 'stripe';
}

function getPaymentIntentId(session) {
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
}

function buildStripeMetaFromSession(session) {
  return {
    checkoutSessionId: session.id,
    paymentIntentId: getPaymentIntentId(session),
    paymentMethod: mapPaymentMethod(session),
    paidAt: new Date().toISOString(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUniqueViolation(err) {
  return err?.code === '23505' || /duplicate key/i.test(err?.message || '');
}

async function findOrderIdBySession(sessionId) {
  if (!sessionId) return null;
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function markDraftCompleted(draftId, orderId) {
  await supabaseAdmin
    .from('checkout_drafts')
    .update({
      status: 'completed',
      order_id: orderId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', draftId);
}

async function releaseDraftClaim(draft, err) {
  const expired = draft.expires_at && new Date(draft.expires_at) < new Date();
  await supabaseAdmin
    .from('checkout_drafts')
    .update({
      status: expired ? 'expired' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', draft.id)
    .eq('status', 'completing');
  console.error('[fulfillDraftById] released claim', draft.id, err.message);
}

async function waitForExistingFulfillment(draftId, sessionId) {
  for (let i = 0; i < 20; i += 1) {
    const existingId = await findOrderIdBySession(sessionId);
    if (existingId) {
      await markDraftCompleted(draftId, existingId);
      return { orderId: existingId, alreadyFulfilled: true };
    }

    const { data: draft } = await supabaseAdmin
      .from('checkout_drafts')
      .select('status, order_id')
      .eq('id', draftId)
      .maybeSingle();

    if (draft?.status === 'completed' && draft.order_id) {
      return { orderId: draft.order_id, alreadyFulfilled: true };
    }

    await sleep(200);
  }

  throw new Error(`Checkout fulfillment already in progress for draft ${draftId}`);
}

async function claimCheckoutDraft(draftId, { allowExpired }) {
  const now = new Date().toISOString();
  const statuses = allowExpired ? ['pending', 'expired'] : ['pending'];

  const { data: claimed, error } = await supabaseAdmin
    .from('checkout_drafts')
    .update({ status: 'completing', updated_at: now })
    .eq('id', draftId)
    .in('status', statuses)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (claimed) return claimed;

  const staleBefore = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: stale, error: staleErr } = await supabaseAdmin
    .from('checkout_drafts')
    .update({ status: 'completing', updated_at: now })
    .eq('id', draftId)
    .eq('status', 'completing')
    .lt('updated_at', staleBefore)
    .select('*')
    .maybeSingle();

  if (staleErr) throw staleErr;
  return stale ?? null;
}

async function fulfillDraftById(draftId, stripeMeta, options = {}) {
  const { allowExpired = false } = options;

  if (!supabaseAdmin) throw new Error('Supabase admin not configured');

  const existingId = await findOrderIdBySession(stripeMeta.checkoutSessionId);
  if (existingId) {
    await markDraftCompleted(draftId, existingId);
    return { orderId: existingId, alreadyFulfilled: true };
  }

  const claimed = await claimCheckoutDraft(draftId, { allowExpired });

  if (!claimed) {
    const { data: draft, error } = await supabaseAdmin
      .from('checkout_drafts')
      .select('*')
      .eq('id', draftId)
      .maybeSingle();

    if (error) throw error;
    if (!draft) throw new Error(`Checkout draft not found: ${draftId}`);

    if (draft.status === 'completed' && draft.order_id) {
      return { orderId: draft.order_id, alreadyFulfilled: true };
    }
    if (draft.status === 'cancelled') {
      throw new Error('Checkout draft is cancelled');
    }
    if (draft.status === 'expired' && !allowExpired) {
      throw new Error('Checkout draft is expired');
    }
    if (draft.status === 'completing') {
      return waitForExistingFulfillment(draftId, stripeMeta.checkoutSessionId);
    }
    throw new Error(`Checkout draft is ${draft.status}`);
  }

  try {
    const { orderId } = await fulfillOrder({
      pricedPayload: claimed.payload,
      userId: claimed.user_id,
      authHeader: null,
      stripeMeta,
    });

    await markDraftCompleted(draftId, orderId);
    return { orderId, alreadyFulfilled: false };
  } catch (err) {
    if (isUniqueViolation(err)) {
      const winnerId = await findOrderIdBySession(stripeMeta.checkoutSessionId);
      if (winnerId) {
        await markDraftCompleted(draftId, winnerId);
        return { orderId: winnerId, alreadyFulfilled: true };
      }
    }
    await releaseDraftClaim(claimed, err);
    throw err;
  }
}

async function fulfillCheckoutSession(session, { eventType, allowExpired = false } = {}) {
  const label = eventType || 'fulfill';

  if (session.payment_status !== 'paid') {
    console.log(
      `[stripe] ${label}: session ${session.id} payment_status=${session.payment_status}, skipping fulfillment`,
    );
    return null;
  }

  const draftId = session.metadata?.draft_id;
  if (!draftId) {
    console.error(`[stripe] ${label}: session ${session.id} missing metadata.draft_id — cannot fulfill`);
    return null;
  }

  const result = await fulfillDraftById(
    draftId,
    buildStripeMetaFromSession(session),
    { allowExpired },
  );

  console.log(
    `[stripe] ${label}: draft ${draftId} session ${session.id} → order ${result.orderId}`,
    result.alreadyFulfilled ? '(already fulfilled)' : '',
  );

  return result;
}

exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, shipping, coupon_code } = req.body;

    const pricedPayload = await validateAndPriceCart({
      items,
      shipping,
      coupon_code,
      userId,
    });

    const ttlHours = getPendingOrderTtlHours();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const { data: draft, error: draftErr } = await supabaseAdmin
      .from('checkout_drafts')
      .insert({
        user_id: userId,
        payload: pricedPayload,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (draftErr) throw draftErr;

    const stripe = getStripe();
    const frontendUrl = getFrontendUrl();
    const amountSatang = thbToStripeAmount(pricedPayload.grandTotal);

    if (amountSatang < 1000) {
      await supabaseAdmin.from('checkout_drafts').delete().eq('id', draft.id);
      return res.status(400).json({ error: 'ยอดชำระต่ำกว่าขั้นต่ำที่ Stripe รองรับ' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'thb',
      payment_method_types: ['promptpay', 'card'],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'thb',
          unit_amount: amountSatang,
          product_data: {
            name: 'PimSuea Custom Order',
            description: 'Custom printed apparel order',
          },
        },
      }],
      metadata: {
        draft_id: draft.id,
        user_id: userId,
      },
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout`,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    await supabaseAdmin
      .from('checkout_drafts')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft.id);

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    if (err instanceof CartValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error('createCheckoutSession error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

exports.getCheckoutSessionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const { data: draft, error } = await supabaseAdmin
      .from('checkout_drafts')
      .select('*')
      .eq('stripe_checkout_session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!draft) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (draft.status === 'completed' && draft.order_id) {
      return res.json({ status: 'paid', orderId: draft.order_id });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Webhook / reconcile create the order. Polling only waits.
      return res.json({ status: 'pending' });
    }

    if (session.status === 'expired') {
      await supabaseAdmin
        .from('checkout_drafts')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', draft.id)
        .eq('status', 'pending');
      return res.json({ status: 'expired' });
    }

    res.json({ status: 'pending' });
  } catch (err) {
    console.error('getCheckoutSessionStatus error:', err);
    res.status(500).json({ error: 'Failed to get session status' });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — ignoring webhook');
    return res.status(503).send('Webhook secret not configured');
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (
      event.type === 'checkout.session.completed'
      || event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await fulfillCheckoutSession(event.data.object, {
        eventType: event.type,
        allowExpired: true,
      });
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const draftId = session.metadata?.draft_id;
      if (draftId) {
        await supabaseAdmin
          .from('checkout_drafts')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', draftId)
          .eq('status', 'pending');
      }
    }
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  res.json({ received: true });
};

module.exports.fulfillDraftById = fulfillDraftById;
module.exports.buildStripeMetaFromSession = buildStripeMetaFromSession;
module.exports.fulfillCheckoutSession = fulfillCheckoutSession;
