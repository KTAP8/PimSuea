const { supabaseAdmin } = require('../config/supabaseClient');

async function expireCheckoutDrafts() {
  if (!supabaseAdmin) return;

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from('checkout_drafts')
    .update({ status: 'expired', updated_at: now })
    .eq('status', 'pending')
    .lt('expires_at', now);

  if (error) {
    console.error('[expireCheckoutDrafts]', error.message);
  }
}

function startExpireCheckoutDraftsJob() {
  expireCheckoutDrafts();
  const oneHour = 60 * 60 * 1000;
  setInterval(expireCheckoutDrafts, oneHour);
}

module.exports = { expireCheckoutDrafts, startExpireCheckoutDraftsJob };
