/**
 * Integer version of the published Terms of Service + Privacy Policy.
 * There is no separate Privacy document yet — both timestamps are recorded
 * together. Bump this when either document changes materially
 * (e.g. gift-mode / PDPA sections for recipient data).
 *
 * Keep in sync with:
 *   - pimsuea-frontend/src/lib/legal.ts
 *   - handle_new_user() current_version in add_terms_acceptance.sql
 */
const CURRENT_TERMS_VERSION = 2;

function consentStamp(now = new Date()) {
  const iso = now.toISOString();
  return {
    terms_accepted_at: iso,
    terms_version: CURRENT_TERMS_VERSION,
    privacy_accepted_at: iso,
  };
}

module.exports = { CURRENT_TERMS_VERSION, consentStamp };
