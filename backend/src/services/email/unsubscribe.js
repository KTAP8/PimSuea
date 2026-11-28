const crypto = require('crypto');

const secret = () => process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.GUEST_CLAIM_SECRET || process.env.SUPABASE_SECRET_KEY || '';
const sign = (userId) => crypto.createHmac('sha256', secret()).update(`unsub:${userId}`).digest('base64url');

function unsubscribeToken(userId) {
  return sign(userId);
}

function verifyUnsubscribe(userId, token) {
  if (!userId || typeof token !== 'string') return false;
  const expected = sign(userId);
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

module.exports = { unsubscribeToken, verifyUnsubscribe };
