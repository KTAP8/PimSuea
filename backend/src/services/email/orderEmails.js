/** Transactional order emails. Idempotent via the lifecycle_emails ledger. */
const { supabaseAdmin } = require('../../config/supabaseClient');
const { isEmailConfigured, appLink, deliver } = require('./client');
const { ledgerAvailable, claim, release } = require('./ledger');
const { getRecipient } = require('./recipient');
const templates = require('./templates');

const DELIVERY_DAYS = { min: 5, max: 14 }; // keep in sync with frontend lib/deliveryEstimate.ts

function etaWindow(locale, from = new Date()) {
  const fmt = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
  const add = (d) => new Date(from.getTime() + d * 86400000);
  return { from: fmt.format(add(DELIVERY_DAYS.min)), to: fmt.format(add(DELIVERY_DAYS.max)) };
}

async function ready() {
  return isEmailConfigured() && (await ledgerAvailable());
}

/** Send once per order. Safe to call from fulfillment and from the hourly job. */
async function sendOrderConfirmation(orderId) {
  if (!(await ready())) return { skipped: 'not_ready' };
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, total_amount, delivery_fee, discount_amount, paid_at, order_items ( quantity, unit_price, size, user_design:user_designs ( design_name ) )')
    .eq('id', orderId)
    .single();
  if (error || !order) return { skipped: 'no_order' };
  const to = await getRecipient(order.user_id);
  if (!to) return { skipped: 'no_recipient' };

  const rowId = await claim('order_confirmation', order.id, order.user_id);
  if (!rowId) return { skipped: 'already_sent' };
  try {
    const items = (order.order_items || []).map((i) => ({
      name: i.user_design?.design_name || 'Custom shirt', size: i.size, qty: i.quantity, lineTotal: Number(i.unit_price) * i.quantity,
    }));
    const mail = templates.orderConfirmation({
      locale: to.locale, firstName: to.firstName, orderId: order.id, items,
      total: Number(order.total_amount), delivery: Number(order.delivery_fee) || 0, discount: Number(order.discount_amount) || 0,
      eta: etaWindow(to.locale, order.paid_at ? new Date(order.paid_at) : new Date()),
      ordersUrl: appLink('/orders', 'order_confirmation'),
    });
    await deliver({ to: to.email, ...mail });
    await supabaseAdmin.from('orders').update({ confirmation_email_at: new Date().toISOString() }).eq('id', order.id);
    return { sent: true };
  } catch (err) {
    await release(rowId);
    throw err;
  }
}

/** Shipped + tracking. Called by the hourly job (ops marks orders shipped directly in the DB). */
async function sendShippedEmail(order, trackingNumbers) {
  if (!(await ready())) return { skipped: 'not_ready' };
  const to = await getRecipient(order.user_id);
  if (!to) return { skipped: 'no_recipient' };
  const rowId = await claim('shipped', order.id, order.user_id);
  if (!rowId) return { skipped: 'already_sent' };
  try {
    const mail = templates.shipped({ locale: to.locale, firstName: to.firstName, trackingNumbers, ordersUrl: appLink('/orders', 'shipped') });
    await deliver({ to: to.email, ...mail });
    await supabaseAdmin.from('orders').update({ shipped_email_at: new Date().toISOString() }).eq('id', order.id);
    return { sent: true };
  } catch (err) {
    await release(rowId);
    throw err;
  }
}

module.exports = { sendOrderConfirmation, sendShippedEmail, ready };
