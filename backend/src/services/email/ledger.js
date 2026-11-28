/**
 * lifecycle_emails is the idempotency ledger: a row is claimed BEFORE sending
 * (unique kind+ref_id), and released again if the send fails.
 */
const { supabaseAdmin } = require('../../config/supabaseClient');

let tableMissingLogged = false;

async function ledgerAvailable() {
  const { error } = await supabaseAdmin.from('lifecycle_emails').select('id').limit(1);
  if (!error) return true;
  if (!tableMissingLogged) {
    console.warn('[email] lifecycle_emails table missing — apply backend/migrations/redesign_guest_and_lifecycle.sql');
    tableMissingLogged = true;
  }
  return false;
}

/** @returns {Promise<string|null>} ledger row id, or null if this email was already sent. */
async function claim(kind, refId, userId) {
  const { data, error } = await supabaseAdmin
    .from('lifecycle_emails')
    .insert({ kind, ref_id: String(refId), user_id: userId ?? null })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') return null; // already sent
    throw error;
  }
  return data.id;
}

async function release(rowId) {
  if (rowId) await supabaseAdmin.from('lifecycle_emails').delete().eq('id', rowId);
}

/** Marketing-type emails sent to this user in the last N days (frequency cap). */
async function recentCount(userId, kinds, days) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { count } = await supabaseAdmin
    .from('lifecycle_emails')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('kind', kinds)
    .gte('sent_at', since);
  return count ?? 0;
}

module.exports = { ledgerAvailable, claim, release, recentCount };
