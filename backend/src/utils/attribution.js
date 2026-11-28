/**
 * Sanitize client-sent marketing attribution ({ first_touch, last_touch }).
 * Only whitelisted string fields survive, each clipped, so the jsonb stays small
 * and cannot carry arbitrary payloads.
 */
const TOUCH_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'fbc', 'referrer', 'landing_path', 'lang', 'ts',
];
const MAX_LEN = 200;

function sanitizeTouch(touch) {
  if (!touch || typeof touch !== 'object') return null;
  const out = {};
  for (const key of TOUCH_KEYS) {
    const v = touch[key];
    if (typeof v === 'string' && v.trim()) out[key] = v.trim().slice(0, MAX_LEN);
  }
  return Object.keys(out).length ? out : null;
}

function sanitizeAttribution(attr) {
  if (!attr || typeof attr !== 'object') return null;
  const first_touch = sanitizeTouch(attr.first_touch);
  const last_touch = sanitizeTouch(attr.last_touch);
  if (!first_touch && !last_touch) return null;
  return { first_touch, last_touch };
}

module.exports = { sanitizeAttribution };
