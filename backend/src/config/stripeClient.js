const Stripe = require('stripe');

let stripe = null;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

function getPendingOrderTtlHours() {
  const hours = Number(process.env.STRIPE_PENDING_ORDER_TTL_HOURS);
  return Number.isFinite(hours) && hours > 0 ? hours : 24;
}

function getFrontendUrl() {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return base.replace(/\/$/, '');
}

/** THB → Stripe amount in satang (smallest unit) */
function thbToStripeAmount(thb) {
  return Math.round(Number(thb) * 100);
}

module.exports = {
  getStripe,
  getPendingOrderTtlHours,
  getFrontendUrl,
  thbToStripeAmount,
};
