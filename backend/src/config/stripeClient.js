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

function isLocalhostUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

function getFrontendUrl() {
  const configured = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const liveKey = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_');
  const productionFallback = 'https://app.pimsuea.com';

  if (liveKey && (!configured || isLocalhostUrl(configured))) {
    console.error(
      'FRONTEND_URL is missing or localhost while STRIPE_SECRET_KEY is live — using',
      productionFallback,
    );
    return productionFallback;
  }

  return configured || 'http://localhost:5173';
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
