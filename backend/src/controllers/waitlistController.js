const { supabaseAdmin } = require('../config/supabaseClient');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PimSuea <onboarding@resend.dev>';

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
      subject: 'ยืนยันการลงทะเบียน PimSuea Waitlist 🎉',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="margin: 0 0 16px;">ยินดีต้อนรับสู่ PimSuea!</h2>
          <p style="color: #444; line-height: 1.6;">
            คุณได้ลงทะเบียนรอรับสิทธิ์เข้าใช้งาน <strong>PimSuea</strong> เรียบร้อยแล้ว
            เราจะแจ้งให้คุณทราบทันทีเมื่อแพลตฟอร์มพร้อมใช้งาน
          </p>
          <p style="color: #444; line-height: 1.6;">
            PimSuea คือแพลตฟอร์มออกแบบและพิมพ์เสื้อยืด Custom ที่ง่ายที่สุด
            ออกแบบ พิมพ์ และรับของถึงบ้านคุณ
          </p>
          <p style="color: #888; font-size: 13px; margin-top: 32px;">
            หากคุณไม่ได้ลงทะเบียน กรุณาเพิกเฉยต่ออีเมลฉบับนี้
          </p>
        </div>
      `,
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
        subject: 'PimSuea พร้อมแล้ว! 🚀',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="margin: 0 0 16px;">PimSuea เปิดตัวแล้ว!</h2>
            <p style="color: #444; line-height: 1.6;">
              เรายินดีที่จะแจ้งให้ทราบว่า <strong>PimSuea</strong> พร้อมให้คุณใช้งานแล้ว!
              ขอบคุณที่รอเราอย่างอดทน
            </p>
            <a href="https://pimsuea.com" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
              เริ่มออกแบบเลย
            </a>
            <p style="color: #888; font-size: 13px; margin-top: 32px;">
              หากคุณไม่ต้องการรับอีเมลจากเรา กรุณาเพิกเฉยต่ออีเมลฉบับนี้
            </p>
          </div>
        `,
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
