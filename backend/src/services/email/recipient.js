const { supabaseAdmin } = require('../../config/supabaseClient');
const { getFrontendUrl } = require('../../config/stripeClient');
const { unsubscribeToken } = require('./unsubscribe');

/**
 * Email + language + opt-out for a user. Works before the migration (falls back to
 * English / not opted out when the new columns don't exist yet).
 */
async function getRecipient(userId) {
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('email, first_name, locale, email_opt_out, is_guest')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    ({ data } = await supabaseAdmin.from('profiles').select('email, first_name').eq('id', userId).maybeSingle());
  }
  if (!data?.email || data.is_guest) return null;
  return {
    userId,
    email: data.email,
    firstName: data.first_name || null,
    locale: data.locale === 'th' ? 'th' : 'en',
    optedOut: Boolean(data.email_opt_out),
    unsubscribeUrl: `${getFrontendUrl()}/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`,
  };
}

module.exports = { getRecipient };
