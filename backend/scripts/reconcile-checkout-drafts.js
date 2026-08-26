#!/usr/bin/env node
/**
 * One-off / manual recovery for paid Stripe sessions whose orders were never created.
 * Usage (from backend/): node scripts/reconcile-checkout-drafts.js
 */
require('dotenv').config();

const { reconcilePaidCheckoutDrafts } = require('../src/jobs/reconcilePaidCheckoutDrafts');

reconcilePaidCheckoutDrafts()
  .then((result) => {
    console.log('Reconcile complete:', result);
    process.exit(result.errors > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Reconcile failed:', err);
    process.exit(1);
  });
