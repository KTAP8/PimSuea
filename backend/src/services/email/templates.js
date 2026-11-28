/**
 * Lifecycle email templates (EN / TH). Inline styles only — email clients ignore <style>.
 * Every template returns { subject, html, text }.
 */
const TEAL = '#08636D';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const thb = (n) => `฿${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const LINE_URL = `https://line.me/R/ti/p/${encodeURIComponent(process.env.LINE_ID || '@PimSuea')}`;

const T = {
  en: {
    hi: (n) => (n ? `Hi ${n},` : 'Hi,'),
    help: 'Questions? Reply to this email or chat with us on LINE (English OK).',
    unsub: 'Stop these reminders',
    confSubject: (id) => `Order confirmed · #${String(id).slice(0, 8)}`,
    confTitle: 'Thanks — your order is confirmed',
    confBody: 'We’ve received your payment and your shirts are going to print in Bangkok.',
    eta: (f, t) => `Estimated arrival: ${f} – ${t}`,
    total: 'Total paid', delivery: 'Delivery', discount: 'Discount', free: 'Free',
    viewOrder: 'View your order',
    shipSubject: 'Your shirts are on the way',
    shipTitle: 'Shipped! 📦',
    shipBody: 'Your order has left our studio. Track it below — tracking can take a few hours to appear.',
    track: 'Track parcel',
    cart1Subject: 'Your design is waiting',
    cart1Title: 'Still thinking it over?',
    cart1Body: (n) => `You have ${n} shirt${n === 1 ? '' : 's'} in your cart. Your design is saved — pick up right where you left off.`,
    cart2Subject: 'Last reminder: your shirts are still in the cart',
    cart2Title: 'Need a hand finishing your order?',
    cart2Body: 'Ordering for a group? Prices drop from 12 shirts — mix any sizes. Reply or message us on LINE and we’ll help.',
    cartCta: 'Finish my order',
    expSubject: 'Your checkout expired — your cart is saved',
    expTitle: 'Your payment didn’t go through',
    expBody: (total) => `Your checkout for ${total} expired before payment. Nothing was charged and your cart is still saved.`,
    expCta: 'Try again',
    revSubject: 'How did your shirts turn out?',
    revTitle: 'How did they turn out?',
    revBody: 'We’d love to see them! Reply with a photo and one line about your order — with your OK, we may feature it on our site.',
    revGoogle: 'Leave a Google review',
    revLine: 'Send a photo on LINE',
  },
  th: {
    hi: (n) => (n ? `สวัสดีคุณ${n}` : 'สวัสดีค่ะ'),
    help: 'มีคำถาม? ตอบกลับอีเมลนี้หรือแชทกับเราทาง LINE',
    unsub: 'หยุดรับการแจ้งเตือนนี้',
    confSubject: (id) => `ยืนยันคำสั่งซื้อ · #${String(id).slice(0, 8)}`,
    confTitle: 'ขอบคุณ — ยืนยันคำสั่งซื้อแล้ว',
    confBody: 'เราได้รับการชำระเงินแล้ว เสื้อของคุณกำลังเข้าสู่ขั้นตอนการพิมพ์ที่กรุงเทพฯ',
    eta: (f, t) => `คาดว่าจะได้รับ: ${f} – ${t}`,
    total: 'ยอดชำระ', delivery: 'ค่าจัดส่ง', discount: 'ส่วนลด', free: 'ฟรี',
    viewOrder: 'ดูคำสั่งซื้อ',
    shipSubject: 'เสื้อของคุณกำลังเดินทาง',
    shipTitle: 'จัดส่งแล้ว! 📦',
    shipBody: 'คำสั่งซื้อของคุณออกจากสตูดิโอแล้ว ติดตามพัสดุได้ด้านล่าง (ข้อมูลอาจใช้เวลาสักครู่จึงจะแสดง)',
    track: 'ติดตามพัสดุ',
    cart1Subject: 'ดีไซน์ของคุณรออยู่',
    cart1Title: 'ยังตัดสินใจอยู่ใช่ไหม?',
    cart1Body: (n) => `คุณมีเสื้อ ${n} ตัวในตะกร้า ดีไซน์ถูกบันทึกไว้แล้ว กลับมาทำต่อได้เลย`,
    cart2Subject: 'แจ้งเตือนครั้งสุดท้าย: เสื้อยังอยู่ในตะกร้า',
    cart2Title: 'ให้เราช่วยไหม?',
    cart2Body: 'สั่งให้ทีมหรือกลุ่ม? ราคาถูกลงตั้งแต่ 12 ตัว เลือกไซซ์ผสมได้ ตอบกลับหรือทักเราทาง LINE ได้เลย',
    cartCta: 'สั่งซื้อต่อ',
    expSubject: 'การชำระเงินหมดเวลา — ตะกร้ายังอยู่',
    expTitle: 'การชำระเงินยังไม่สำเร็จ',
    expBody: (total) => `การชำระเงิน ${total} หมดเวลาก่อนชำระ ไม่มีการตัดเงินใด ๆ และตะกร้ายังถูกบันทึกไว้`,
    expCta: 'ลองอีกครั้ง',
    revSubject: 'เสื้อออกมาเป็นยังไงบ้าง?',
    revTitle: 'เสื้อออกมาเป็นยังไงบ้าง?',
    revBody: 'อยากเห็นมาก! ตอบกลับพร้อมรูปและความเห็นสั้น ๆ หนึ่งประโยค ถ้าคุณอนุญาต เราอาจนำไปแสดงบนเว็บไซต์',
    revGoogle: 'รีวิวบน Google',
    revLine: 'ส่งรูปทาง LINE',
  },
};

function layout({ title, intro, body, cta, unsubscribeUrl, locale }) {
  const t = T[locale];
  const button = cta
    ? `<p style="margin:28px 0"><a href="${esc(cta.url)}" style="background:${TEAL};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">${esc(cta.label)}</a></p>`
    : '';
  const unsub = unsubscribeUrl ? ` · <a href="${esc(unsubscribeUrl)}" style="color:#6b7280">${esc(t.unsub)}</a>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1f24">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;border:1px solid #e5e7eb" cellpadding="0" cellspacing="0"><tr><td style="padding:28px">
<p style="margin:0 0 20px;font-weight:700;color:${TEAL};font-size:18px">PimSuea</p>
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3">${esc(title)}</h1>
<p style="margin:0 0 8px;font-size:15px;line-height:1.6">${esc(intro)}</p>
${body}${button}
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6">${esc(t.help)} <a href="${LINE_URL}" style="color:${TEAL}">LINE</a>${unsub}</p>
</td></tr></table></td></tr></table></body></html>`;
}

function orderConfirmation({ locale, firstName, orderId, items, total, delivery, discount, eta, ordersUrl }) {
  const t = T[locale];
  const rows = items.map((i) => `<tr><td style="padding:6px 0;font-size:14px">${esc(i.name)} <span style="color:#6b7280">· ${esc(i.size)} × ${i.qty}</span></td><td align="right" style="font-size:14px">${thb(i.lineTotal)}</td></tr>`).join('');
  const extra = [
    discount > 0 ? `<tr><td style="font-size:14px;color:#0d7a45">${t.discount}</td><td align="right" style="font-size:14px;color:#0d7a45">−${thb(discount)}</td></tr>` : '',
    `<tr><td style="font-size:14px">${t.delivery}</td><td align="right" style="font-size:14px">${delivery > 0 ? thb(delivery) : t.free}</td></tr>`,
    `<tr><td style="padding-top:8px;border-top:1px solid #e5e7eb;font-weight:700">${t.total}</td><td align="right" style="padding-top:8px;border-top:1px solid #e5e7eb;font-weight:700">${thb(total)}</td></tr>`,
  ].join('');
  const body = `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${esc(t.confBody)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${extra}</table>
<p style="margin:16px 0 0;font-size:14px;font-weight:600">${esc(t.eta(eta.from, eta.to))}</p>`;
  const html = layout({ title: t.confTitle, intro: t.hi(firstName), body, cta: { label: t.viewOrder, url: ordersUrl }, locale });
  const text = `${t.hi(firstName)}\n\n${t.confBody}\n\n${items.map((i) => `${i.name} · ${i.size} × ${i.qty}  ${thb(i.lineTotal)}`).join('\n')}\n${t.total}: ${thb(total)}\n${t.eta(eta.from, eta.to)}\n\n${t.viewOrder}: ${ordersUrl}`;
  return { subject: t.confSubject(orderId), html, text };
}

function shipped({ locale, firstName, trackingNumbers, ordersUrl }) {
  const t = T[locale];
  const track = (n) => `https://t.17track.net/en#nums=${encodeURIComponent(n)}`;
  const body = `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${esc(t.shipBody)}</p>
${trackingNumbers.map((n) => `<p style="margin:0 0 8px;font-size:14px"><span style="font-family:monospace;font-weight:700">${esc(n)}</span> · <a href="${track(n)}" style="color:${TEAL};font-weight:600">${esc(t.track)}</a></p>`).join('')}`;
  const html = layout({ title: t.shipTitle, intro: t.hi(firstName), body, cta: { label: t.viewOrder, url: ordersUrl }, locale });
  const text = `${t.hi(firstName)}\n\n${t.shipBody}\n\n${trackingNumbers.map((n) => `${n}: ${track(n)}`).join('\n')}\n\n${ordersUrl}`;
  return { subject: t.shipSubject, html, text };
}

function abandonedCart({ locale, firstName, step, shirts, cartUrl, unsubscribeUrl }) {
  const t = T[locale];
  const title = step === 1 ? t.cart1Title : t.cart2Title;
  const msg = step === 1 ? t.cart1Body(shirts) : t.cart2Body;
  const body = `<p style="margin:0;font-size:15px;line-height:1.6">${esc(msg)}</p>`;
  const html = layout({ title, intro: t.hi(firstName), body, cta: { label: t.cartCta, url: cartUrl }, unsubscribeUrl, locale });
  return { subject: step === 1 ? t.cart1Subject : t.cart2Subject, html, text: `${t.hi(firstName)}\n\n${msg}\n\n${t.cartCta}: ${cartUrl}\n\n${t.unsub}: ${unsubscribeUrl}` };
}

function expiredCheckout({ locale, firstName, total, cartUrl, unsubscribeUrl }) {
  const t = T[locale];
  const msg = t.expBody(thb(total));
  const body = `<p style="margin:0;font-size:15px;line-height:1.6">${esc(msg)}</p>`;
  const html = layout({ title: t.expTitle, intro: t.hi(firstName), body, cta: { label: t.expCta, url: cartUrl }, unsubscribeUrl, locale });
  return { subject: t.expSubject, html, text: `${t.hi(firstName)}\n\n${msg}\n\n${t.expCta}: ${cartUrl}\n\n${t.unsub}: ${unsubscribeUrl}` };
}

/** Asks a delivered customer for a photo + one-line quote (feeds content/testimonials.ts, with permission). */
function reviewRequest({ locale, firstName, googleReviewUrl, unsubscribeUrl }) {
  const t = T[locale];
  const google = googleReviewUrl
    ? `<p style="margin:16px 0 0;font-size:14px"><a href="${esc(googleReviewUrl)}" style="color:${TEAL};font-weight:600">${esc(t.revGoogle)}</a></p>`
    : '';
  const body = `<p style="margin:0;font-size:15px;line-height:1.6">${esc(t.revBody)}</p>${google}`;
  const html = layout({ title: t.revTitle, intro: t.hi(firstName), body, cta: { label: t.revLine, url: LINE_URL }, unsubscribeUrl, locale });
  const text = `${t.hi(firstName)}\n\n${t.revBody}\n\n${t.revLine}: ${LINE_URL}${googleReviewUrl ? `\n${t.revGoogle}: ${googleReviewUrl}` : ''}\n\n${t.unsub}: ${unsubscribeUrl}`;
  return { subject: t.revSubject, html, text };
}

module.exports = { orderConfirmation, shipped, abandonedCart, expiredCheckout, reviewRequest };
