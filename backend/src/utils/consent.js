const { supabaseAdmin } = require('../config/supabaseClient');
const { CURRENT_TERMS_VERSION, consentStamp } = require('../constants/legal');

/**
 * Stamp account-level consent when missing or older than the published version.
 * Does not overwrite a current-version timestamp (signup time is kept).
 */
async function persistProfileConsentIfNeeded(userId, stamp = consentStamp()) {
  if (!supabaseAdmin) return stamp;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('terms_version, terms_accepted_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error reading profile consent:', error);
    return stamp;
  }

  const recordedVersion = profile?.terms_version ?? 0;
  if (profile?.terms_accepted_at && recordedVersion >= CURRENT_TERMS_VERSION) {
    return stamp;
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(stamp)
    .eq('id', userId);

  if (updateError) {
    console.error('Error recording profile consent:', updateError);
  }

  return stamp;
}

module.exports = { persistProfileConsentIfNeeded };
