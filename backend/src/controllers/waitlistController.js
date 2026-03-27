const { supabaseAdmin } = require('../config/supabaseClient');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PimSuea <onboarding@resend.dev>';

const emailWrapper = (content) => `
  <div style="background:#f0f2f4;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="background:#08636D;padding:28px 32px;text-align:center;">
        <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">PimSuea</span>
      </div>
      <div style="padding:32px;">
        ${content}
      </div>
      <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.7;">
          หากคุณไม่ได้ดำเนินการนี้ด้วยตนเอง สามารถเพิกเฉยต่ออีเมลฉบับนี้ได้เลย
        </p>
      </div>
    </div>
  </div>
`;

/** Generate a unique WAIT-prefixed coupon code. */
function generateWaitlistCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return 'WAIT' + suffix;
}

/**
 * Insert a new coupon into the coupons table for a waitlist user.
 * Retries up to 5 times on collision.
 */
async function createWaitlistCoupon() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateWaitlistCode();
    const { error } = await supabaseAdmin.from('coupons').insert({
      code,
      discount_type: 'percentage',
      discount_value: 20,
      max_discount_thb: 200,
      max_total_uses: 1,
      max_uses_per_user: 1,
      is_active: true,
    });
    if (!error) return code;
    if (error.code !== '23505') throw error; // only retry on unique violation
  }
  throw new Error('Failed to generate unique coupon code after 5 attempts');
}

// POST /api/waitlist
// Public — no auth required
const signup = async (req, res) => {
  const { email, name, reason } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'กรุณาระบุอีเมลที่ถูกต้อง' });
  }

  // Insert into DB (unique constraint handles duplicates)
  const { error: dbError } = await supabaseAdmin
    .from('waitlist')
    .insert({
      email: email.trim().toLowerCase(),
      name: name?.trim() || null,
      reason: reason?.trim() || null,
    });

  if (dbError) {
    if (dbError.code === '23505') {
      // Duplicate email — treat as success so we don't leak existence
      return res.status(200).json({ message: 'ลงทะเบียนสำเร็จ' });
    }
    console.error('Waitlist insert error:', dbError);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
  }

  // Send confirmation email (fire-and-forget — don't block response)
  if (process.env.RESEND_API_KEY) {
    resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'ยืนยันการลงทะเบียน Waitlist — PimSuea 🎉',
      html: emailWrapper(`
        <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111;">ยินดีต้อนรับ! 🎉</h2>
        <p style="color:#555;line-height:1.7;margin:0 0 16px;">
          คุณได้ลงทะเบียนรอรับสิทธิ์เข้าใช้งาน <strong>PimSuea</strong> เรียบร้อยแล้ว
          เราจะแจ้งให้คุณทราบทันทีที่แพลตฟอร์มพร้อมเปิดให้บริการ
        </p>
        <p style="color:#555;line-height:1.7;margin:0;">
          PimSuea คือแพลตฟอร์มออกแบบและสั่งพิมพ์เสื้อยืด Custom ที่ง่ายที่สุด —
          ออกแบบเอง พิมพ์ลาย และรับของถึงบ้าน
        </p>
      `),
    }).catch(err => console.error('Confirmation email failed:', err));
  }

  return res.status(200).json({ message: 'ลงทะเบียนสำเร็จ' });
};

// POST /api/waitlist/send-coupon
// Protected — generates a unique coupon for a single waitlist email, no email sent yet.
const sendCoupon = async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'กรุณาระบุอีเมล' });
  }

  const normalised = email.trim().toLowerCase();

  // Fetch waitlist row
  const { data: signup, error: fetchError } = await supabaseAdmin
    .from('waitlist')
    .select('id, coupon_code')
    .eq('email', normalised)
    .maybeSingle();

  if (fetchError) {
    console.error('Waitlist fetch error:', fetchError);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }

  if (!signup) {
    return res.status(404).json({ error: 'ไม่พบอีเมลนี้ใน Waitlist' });
  }

  // Idempotent — return existing code if already generated
  if (signup.coupon_code) {
    return res.json({ message: 'มีโค้ดอยู่แล้ว', code: signup.coupon_code, alreadyGenerated: true });
  }

  try {
    const code = await createWaitlistCoupon();

    await supabaseAdmin
      .from('waitlist')
      .update({ coupon_code: code })
      .eq('id', signup.id);

    return res.json({ message: 'สร้างโค้ดสำเร็จ', code, alreadyGenerated: false });
  } catch (err) {
    console.error('Coupon generation error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างโค้ด' });
  }
};

// POST /api/waitlist/notify
// Protected — sends combined launch + coupon email to all unnotified waitlist users.
const notify = async (req, res) => {
  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'RESEND_API_KEY not configured' });
  }

  // Fetch all unnotified signups
  const { data: signups, error: fetchError } = await supabaseAdmin
    .from('waitlist')
    .select('id, email, coupon_code')
    .is('notified_at', null);

  if (fetchError) {
    console.error('Waitlist fetch error:', fetchError);
    return res.status(500).json({ error: 'Failed to fetch waitlist' });
  }

  if (!signups || signups.length === 0) {
    return res.status(200).json({ sent: 0, message: 'No unnotified signups' });
  }

  let sent = 0;
  const failed = [];

  for (const signup of signups) {
    try {
      // Auto-generate coupon if not already done
      let code = signup.coupon_code;
      if (!code) {
        code = await createWaitlistCoupon();
        await supabaseAdmin.from('waitlist').update({ coupon_code: code }).eq('id', signup.id);
      }

      await resend.emails.send({
        from: FROM_EMAIL,
        to: signup.email,
        subject: 'PimSuea เปิดให้บริการแล้ว! + โค้ดส่วนลดพิเศษสำหรับคุณ 🎁',
        html: emailWrapper(`
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111;">รอคอยมานานแล้ว — วันนี้มาถึงแล้ว! 🚀</h2>
          <p style="color:#555;line-height:1.7;margin:0 0 20px;">
            ขอบคุณที่รอคอยเรา — <strong>PimSuea</strong> พร้อมให้คุณออกแบบและสั่งพิมพ์เสื้อยืดในแบบของคุณเองได้แล้ววันนี้!
          </p>

          <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:4px;">
            <h3 style="margin:0 0 10px;font-size:17px;font-weight:700;color:#111;">ของขวัญพิเศษจาก PimSuea 🎁</h3>
            <p style="color:#555;line-height:1.7;margin:0 0 16px;">
              เพื่อเป็นการขอบคุณที่คุณสมัครรอตั้งแต่แรก เราขอมอบ<strong>ส่วนลด 20% สำหรับออเดอร์แรก</strong> (สูงสุด ฿200) เป็นพิเศษสำหรับคุณ
            </p>
            <p style="color:#555;line-height:1.7;margin:0 0 16px;">กรอกโค้ดนี้ที่หน้าชำระเงิน:</p>
            <div style="background:#f0fafa;border:2px solid #08636D;border-radius:10px;padding:16px 24px;text-align:center;margin:0 0 16px;">
              <span style="font-family:monospace;font-size:26px;font-weight:700;letter-spacing:3px;color:#08636D;">${code}</span>
            </div>
            <p style="color:#9ca3af;font-size:12px;margin:0 0 24px;line-height:1.6;">
              ใช้ได้ 1 ครั้งต่อ 1 บัญชีเท่านั้น · ไม่มีวันหมดอายุ
            </p>
          </div>

          <a href="https://pimsuea.com/home" style="display:inline-block;padding:14px 28px;background:#08636D;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
            เริ่มออกแบบเลย →
          </a>
        `),
      });

      // Mark as notified
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('waitlist')
        .update({ notified_at: now, coupon_sent_at: now })
        .eq('id', signup.id);

      sent++;
    } catch (err) {
      console.error(`Failed to notify ${signup.email}:`, err);
      failed.push(signup.email);
    }
  }

  return res.status(200).json({ sent, failed, total: signups.length });
};

module.exports = { signup, notify, sendCoupon };
