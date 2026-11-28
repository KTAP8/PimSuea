/**
 * Guest → account claim.
 *
 * A guest designs under a Supabase anonymous user. Before signing up / in
 * (which replaces the session), the frontend fetches a signed claim token for
 * the anonymous user id. After auth it posts the token back and we move the
 * guest's designs, cart and uploaded files to the real account.
 *
 * Files must be copied: printComposer only reads assets under
 * design-assets/uploads/<userId>/, so canvas URLs are rewritten as well.
 */
const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabaseClient');
const { listObjects, copyObject, deleteObject } = require('../config/r2Client');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FILE_BUCKETS = ['design-assets', 'print-files'];

function secret() {
  const s = process.env.GUEST_CLAIM_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!s) throw new Error('GUEST_CLAIM_SECRET not configured');
  return s;
}

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

function createClaimToken(anonUserId) {
  const payload = b64(JSON.stringify({ sub: anonUserId, exp: Date.now() + TOKEN_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

function verifyClaimToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Date.now() && typeof data.sub === 'string' ? data.sub : null;
  } catch {
    return null;
  }
}

async function moveFiles(fromId, toId) {
  let moved = 0;
  for (const bucket of FILE_BUCKETS) {
    const prefix = `uploads/${fromId}/`;
    const objects = await listObjects(bucket, prefix);
    for (const obj of objects) {
      const dst = `uploads/${toId}/${obj.Key.slice(prefix.length)}`;
      await copyObject(bucket, obj.Key, bucket, dst);
      moved += 1;
    }
    // Best effort: originals are unreachable once the guest is deleted.
    await Promise.allSettled(objects.map((obj) => deleteObject(bucket, obj.Key)));
  }
  return moved;
}

function rewrite(value, fromId, toId) {
  if (value == null) return value;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const out = text.split(`uploads/${fromId}/`).join(`uploads/${toId}/`);
  return typeof value === 'string' ? out : JSON.parse(out);
}

async function moveDesigns(fromId, toId) {
  const { data: designs, error } = await supabaseAdmin
    .from('user_designs')
    .select('id, canvas_data, print_file_url')
    .eq('user_id', fromId);
  if (error) throw error;
  for (const d of designs || []) {
    const { error: upErr } = await supabaseAdmin
      .from('user_designs')
      .update({
        user_id: toId,
        canvas_data: rewrite(d.canvas_data, fromId, toId),
        print_file_url: rewrite(d.print_file_url, fromId, toId),
      })
      .eq('id', d.id);
    if (upErr) throw upErr;
  }
  return (designs || []).length;
}

async function moveCart(fromId, toId) {
  const { data: items, error } = await supabaseAdmin
    .from('cart_items')
    .select('id, print_file_url')
    .eq('user_id', fromId);
  if (error) throw error;
  for (const item of items || []) {
    await supabaseAdmin
      .from('cart_items')
      .update({ user_id: toId, print_file_url: rewrite(item.print_file_url, fromId, toId) })
      .eq('id', item.id);
  }
  return (items || []).length;
}

/**
 * @returns {Promise<{from:string, to:string, designs:number, cartItems:number, files:number, alreadyClaimed?:boolean}>}
 */
async function claimGuest(token, targetUserId) {
  const anonId = verifyClaimToken(token);
  if (!anonId) {
    const err = new Error('Invalid or expired claim token');
    err.status = 400;
    throw err;
  }
  const ids = { from: anonId, to: targetUserId };
  if (anonId === targetUserId) return { ...ids, designs: 0, cartItems: 0, files: 0 }; // upgraded in place

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(anonId);
  if (error || !data?.user) return { ...ids, designs: 0, cartItems: 0, files: 0, alreadyClaimed: true };
  if (!data.user.is_anonymous) {
    const err = new Error('Source account is not a guest');
    err.status = 400;
    throw err;
  }

  const files = await moveFiles(anonId, targetUserId);
  const designs = await moveDesigns(anonId, targetUserId);
  const cartItems = await moveCart(anonId, targetUserId);
  await supabaseAdmin.auth.admin.deleteUser(anonId);
  return { ...ids, designs, cartItems, files };
}

module.exports = { createClaimToken, verifyClaimToken, claimGuest };
