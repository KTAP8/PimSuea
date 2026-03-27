const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Validate a coupon code for the authenticated user.
 * GET /api/coupons/validate?code=XXXXX
 *
 * Returns { valid: true, discount_type, discount_value, max_discount_thb, max_qty }
 * or      { valid: false, reason } with HTTP 200 (so the frontend can show the message).
 */
exports.validateCoupon = async (req, res) => {
  const userId = req.user.id;
  const raw = req.query.code;

  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุรหัสโค้ด' });
  }

  const code = raw.trim().toUpperCase();

  try {
    // Fetch coupon
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('id, code, discount_type, discount_value, max_discount_thb, max_uses_per_user, max_total_uses, max_qty, expires_at, is_active')
      .eq('code', code)
      .maybeSingle();

    if (error) throw error;

    if (!coupon || !coupon.is_active) {
      return res.json({ valid: false, reason: 'ไม่พบรหัสโค้ดนี้ หรือโค้ดถูกปิดใช้งานแล้ว' });
    }

    // Expiry check
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.json({ valid: false, reason: 'รหัสโค้ดนี้หมดอายุแล้ว' });
    }

    // Global usage cap
    if (coupon.max_total_uses != null) {
      const { count, error: countErr } = await supabaseAdmin
        .from('coupon_usages')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id);
      if (countErr) throw countErr;
      if ((count ?? 0) >= coupon.max_total_uses) {
        return res.json({ valid: false, reason: 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว' });
      }
    }

    // Per-user usage cap
    if (coupon.max_uses_per_user != null) {
      const { count: userCount, error: userCountErr } = await supabaseAdmin
        .from('coupon_usages')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId);
      if (userCountErr) throw userCountErr;
      if ((userCount ?? 0) >= coupon.max_uses_per_user) {
        return res.json({ valid: false, reason: 'คุณใช้รหัสโค้ดนี้ครบจำนวนแล้ว' });
      }
    }

    return res.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      max_discount_thb: coupon.max_discount_thb != null ? Number(coupon.max_discount_thb) : null,
      max_qty: coupon.max_qty ?? null,
    });
  } catch (err) {
    console.error('Error validating coupon:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบโค้ด' });
  }
};
