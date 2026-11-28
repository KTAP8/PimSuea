/**
 * Hourly lifecycle emails:
 *  - order confirmation (fallback if the send at payment time failed)
 *  - shipped + tracking (ops marks orders shipped directly in the DB)
 *  - abandoned cart: 24 h, then 72 h
 *  - expired checkout: 2 h after a Stripe checkout expired unpaid
 *  - review request: 7–21 days after delivery (testimonials pipeline)
 * Marketing-type mails are capped at 2 per user per 7 days and stop once the user orders.
 */
const { supabaseAdmin } = require('../config/supabaseClient');
const { sendOrderConfirmation, sendShippedEmail, ready } = require('../services/email/orderEmails');
const { appLink, deliver } = require('../services/email/client');
const { claim, release, recentCount } = require('../services/email/ledger');
const { getRecipient } = require('../services/email/recipient');
const templates = require('../services/email/templates');

const H = 3600000;
const PAID = ['paid_processing', 'printing', 'shipped', 'delivered'];
const NUDGE_KINDS = ['abandoned_cart_1', 'abandoned_cart_2', 'expired_checkout'];
const ago = (ms) => new Date(Date.now() - ms).toISOString();

async function paidSince(userId, sinceIso) {
  const { count } = await supabaseAdmin.from('orders').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).in('status', PAID).gte('created_at', sinceIso);
  return (count ?? 0) > 0;
}

/** Claim → send → release on failure. Respects opt-out + frequency cap. */
async function sendNudge(kind, refId, userId, build) {
  const to = await getRecipient(userId);
  if (!to || to.optedOut) return false;
  if ((await recentCount(userId, NUDGE_KINDS, 7)) >= 2) return false;
  const rowId = await claim(kind, refId, userId);
  if (!rowId) return false;
  try {
    const mail = build(to);
    await deliver({ to: to.email, ...mail, headers: { 'List-Unsubscribe': `<${to.unsubscribeUrl}>` } });
    return true;
  } catch (err) {
    await release(rowId);
    console.error(`[lifecycleEmails] ${kind} failed`, err.message);
    return false;
  }
}

async function confirmations(summary) {
  const { data } = await supabaseAdmin.from('orders').select('id')
    .in('status', PAID).is('confirmation_email_at', null).gte('created_at', ago(72 * H)).limit(50);
  for (const o of data || []) {
    const r = await sendOrderConfirmation(o.id).catch((e) => ({ error: e.message }));
    if (r?.sent) summary.confirmations += 1;
  }
}

async function shipments(summary) {
  const { data } = await supabaseAdmin.from('orders')
    .select('id, user_id, tracking_number, order_shipments ( tracking_number )')
    .eq('status', 'shipped').is('shipped_email_at', null).gte('updated_at', ago(14 * 24 * H)).limit(50);
  for (const o of data || []) {
    const numbers = [o.tracking_number, ...(o.order_shipments || []).map((s) => s.tracking_number)].filter(Boolean);
    if (!numbers.length) continue; // wait until ops adds tracking
    const r = await sendShippedEmail(o, [...new Set(numbers)]).catch((e) => ({ error: e.message }));
    if (r?.sent) summary.shipped += 1;
  }
}

async function abandonedCarts(summary) {
  const { data: items } = await supabaseAdmin.from('cart_items')
    .select('user_id, quantity, updated_at, created_at').gte('updated_at', ago(10 * 24 * H));
  const byUser = new Map();
  for (const i of items || []) {
    const u = byUser.get(i.user_id) || { last: 0, shirts: 0 };
    u.last = Math.max(u.last, Date.parse(i.updated_at || i.created_at));
    u.shirts += i.quantity || 0;
    byUser.set(i.user_id, u);
  }
  for (const [userId, u] of byUser) {
    const idle = Date.now() - u.last;
    if (idle < 24 * H || (await paidSince(userId, new Date(u.last).toISOString()))) continue;
    const ref = `${userId}:${new Date(u.last).toISOString().slice(0, 10)}`;
    const cartUrl = appLink('/checkout', idle < 72 * H ? 'abandoned_cart_1' : 'abandoned_cart_2');
    if (idle < 7 * 24 * H && (await recentCount(userId, ['expired_checkout'], 3)) === 0) {
      const sent = await sendNudge('abandoned_cart_1', ref, userId, (to) =>
        templates.abandonedCart({ locale: to.locale, firstName: to.firstName, step: 1, shirts: u.shirts, cartUrl, unsubscribeUrl: to.unsubscribeUrl }));
      if (sent) { summary.abandoned1 += 1; continue; }
    }
    if (idle >= 72 * H) {
      const { data: first } = await supabaseAdmin.from('lifecycle_emails').select('sent_at')
        .eq('kind', 'abandoned_cart_1').eq('ref_id', ref).maybeSingle();
      if (!first || Date.now() - Date.parse(first.sent_at) < 48 * H) continue;
      const sent = await sendNudge('abandoned_cart_2', ref, userId, (to) =>
        templates.abandonedCart({ locale: to.locale, firstName: to.firstName, step: 2, shirts: u.shirts, cartUrl, unsubscribeUrl: to.unsubscribeUrl }));
      if (sent) summary.abandoned2 += 1;
    }
  }
}

async function expiredCheckouts(summary) {
  const { data } = await supabaseAdmin.from('checkout_drafts').select('id, user_id, created_at, payload')
    .eq('status', 'expired').lte('expires_at', ago(2 * H)).gte('expires_at', ago(48 * H)).limit(50);
  for (const d of data || []) {
    if (await paidSince(d.user_id, d.created_at)) continue;
    const sent = await sendNudge('expired_checkout', d.id, d.user_id, (to) =>
      templates.expiredCheckout({ locale: to.locale, firstName: to.firstName, total: d.payload?.grandTotal ?? 0,
        cartUrl: appLink('/checkout', 'expired_checkout'), unsubscribeUrl: to.unsubscribeUrl }));
    if (sent) summary.expired += 1;
  }
}

/** 7–21 days after delivery: ask for a photo + quote (once per order, respects opt-out). */
async function reviewRequests(summary) {
  const { data } = await supabaseAdmin.from('orders').select('id, user_id')
    .eq('status', 'delivered').lte('updated_at', ago(7 * 24 * H)).gte('updated_at', ago(21 * 24 * H)).limit(50);
  for (const o of data || []) {
    const to = await getRecipient(o.user_id);
    if (!to || to.optedOut) continue;
    const rowId = await claim('review_request', o.id, o.user_id);
    if (!rowId) continue;
    try {
      const mail = templates.reviewRequest({ locale: to.locale, firstName: to.firstName,
        googleReviewUrl: process.env.GOOGLE_REVIEW_URL || null, unsubscribeUrl: to.unsubscribeUrl });
      await deliver({ to: to.email, ...mail, headers: { 'List-Unsubscribe': `<${to.unsubscribeUrl}>` } });
      summary.reviews += 1;
    } catch (err) {
      await release(rowId);
      console.error('[lifecycleEmails] review_request failed', err.message);
    }
  }
}

async function runLifecycleEmails() {
  if (!(await ready())) return { skipped: 'not_ready' };
  const summary = { confirmations: 0, shipped: 0, abandoned1: 0, abandoned2: 0, expired: 0, reviews: 0 };
  for (const step of [confirmations, shipments, expiredCheckouts, abandonedCarts, reviewRequests]) {
    try { await step(summary); } catch (err) { console.error(`[lifecycleEmails] ${step.name} failed`, err.message); }
  }
  console.log('[lifecycleEmails] done', summary);
  return summary;
}

function startLifecycleEmailJob() {
  const run = () => runLifecycleEmails().catch((err) => console.error('[lifecycleEmails] unhandled', err));
  setTimeout(run, 2 * 60 * 1000); // let the server settle after boot
  setInterval(run, H);
}

module.exports = { runLifecycleEmails, startLifecycleEmailJob };
