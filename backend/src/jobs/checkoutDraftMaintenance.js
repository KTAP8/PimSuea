const { reconcilePaidCheckoutDrafts } = require('./reconcilePaidCheckoutDrafts');
const { expireCheckoutDrafts } = require('./expireCheckoutDrafts');

/**
 * Run paid-draft reconciliation before expiry so paid checkouts are never marked expired.
 */
async function runCheckoutDraftMaintenance() {
  await reconcilePaidCheckoutDrafts();
  await expireCheckoutDrafts();
}

function startCheckoutDraftMaintenanceJob() {
  const run = () => {
    runCheckoutDraftMaintenance().catch((err) => {
      console.error('[checkoutDraftMaintenance] unhandled error:', err);
    });
  };

  run();
  const oneHour = 60 * 60 * 1000;
  setInterval(run, oneHour);
}

module.exports = { runCheckoutDraftMaintenance, startCheckoutDraftMaintenanceJob };
