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

// POST /api/waitlist/notify
// Protected — requires valid Bearer JWT (admin only)
const notify = async (req, res) => {
  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'RESEND_API_KEY not configured' });
  }

  // Fetch all unnotified signups
  const { data: signups, error: fetchError } = await supabaseAdmin
    .from('waitlist')
    .select('id, email')
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
      await resend.emails.send({
        from: FROM_EMAIL,
        to: signup.email,
        subject: 'PimSuea เปิดให้บริการแล้ว! 🚀',
        html: emailWrapper(`
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111;">รอคอยมานานแล้ว — วันนี้มาถึงแล้ว! 🚀</h2>
          <p style="color:#555;line-height:1.7;margin:0 0 24px;">
            ขอบคุณที่รอคอยเรา — <strong>PimSuea</strong> พร้อมให้คุณออกแบบและสั่งพิมพ์เสื้อยืดในแบบของคุณเองได้แล้ววันนี้!
          </p>
          <a href="https://pimsuea.com" style="display:inline-block;padding:14px 28px;background:#08636D;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
            เริ่มออกแบบเลย →
          </a>
        `),
      });

      // Mark as notified
      await supabaseAdmin
        .from('waitlist')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', signup.id);

      sent++;
    } catch (err) {
      console.error(`Failed to notify ${signup.email}:`, err);
      failed.push(signup.email);
    }
  }

  return res.status(200).json({ sent, failed, total: signups.length });
};

module.exports = { signup, notify };
