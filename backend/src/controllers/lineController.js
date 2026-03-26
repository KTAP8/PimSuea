const crypto = require('crypto');
const axios = require('axios');
const { supabaseAdmin } = require('../config/supabaseClient');

const CHANNEL_SECRET       = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const ADMIN_USER_ID        = process.env.LINE_ADMIN_USER_ID;

// ─── LINE API helpers ─────────────────────────────────────────────────────────

function verifySignature(rawBody, signature) {
    const hash = crypto
        .createHmac('sha256', CHANNEL_SECRET)
        .update(rawBody)
        .digest('base64');
    return hash === signature;
}

async function replyMessage(replyToken, text) {
    await axios.post('https://api.line.me/v2/bot/message/reply', {
        replyToken,
        messages: [{ type: 'text', text }],
    }, {
        headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
}

async function pushMessage(userId, text) {
    await axios.post('https://api.line.me/v2/bot/message/push', {
        to: userId,
        messages: [{ type: 'text', text }],
    }, {
        headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleUserMessage(event) {
    const userId     = event.source.userId;
    const replyToken = event.replyToken;
    const msgType    = event.message.type;

    // Text message: look for "#<orderId>" to link order to LINE account
    if (msgType === 'text') {
        const match = event.message.text.match(/#(\d+)/);
        if (!match) return; // ignore unrelated messages

        const orderId = parseInt(match[1]);
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('id, status, total_amount')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            await replyMessage(replyToken,
                `ไม่พบคำสั่งซื้อ #${orderId} กรุณาตรวจสอบหมายเลขอีกครั้งค่ะ`);
            return;
        }

        if (order.status !== 'pending_payment') {
            await replyMessage(replyToken,
                `คำสั่งซื้อ #${orderId} ไม่ได้อยู่ในสถานะรอชำระเงินค่ะ`);
            return;
        }

        // Link LINE user ID to this order
        await supabaseAdmin
            .from('orders')
            .update({ line_user_id: userId })
            .eq('id', orderId);

        await replyMessage(replyToken,
            `รับทราบคำสั่งซื้อ #${orderId} ยอดชำระ ฿${Number(order.total_amount).toLocaleString()} บาท\n\nกรุณาโอนเงินแล้วส่งสลิปในแชทนี้เลยค่ะ 🙏`);
        return;
    }

    // Image message: acknowledge slip receipt
    if (msgType === 'image') {
        await replyMessage(replyToken,
            'ได้รับสลิปแล้วค่ะ กำลังตรวจสอบ ทีมงานจะยืนยันภายใน 1–2 ชั่วโมง 🙏');
    }
}

async function handleAdminMessage(event) {
    const replyToken = event.replyToken;
    if (event.message.type !== 'text') return;

    const match = event.message.text.match(/confirm\s+#?(\d+)/i);
    if (!match) return;

    const orderId = parseInt(match[1]);
    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('id, status, line_user_id')
        .eq('id', orderId)
        .single();

    if (error || !order) {
        await replyMessage(replyToken, `ไม่พบคำสั่งซื้อ #${orderId}`);
        return;
    }

    if (order.status !== 'pending_payment') {
        await replyMessage(replyToken,
            `Order #${orderId} มีสถานะ "${order.status}" อยู่แล้ว`);
        return;
    }

    await supabaseAdmin
        .from('orders')
        .update({ status: 'paid_processing' })
        .eq('id', orderId);

    await replyMessage(replyToken,
        `✅ ยืนยัน Order #${orderId} เรียบร้อย สถานะเปลี่ยนเป็น "ชำระแล้ว & กำลังผลิต"`);

    // Notify customer via LINE if we have their LINE user ID
    if (order.line_user_id) {
        await pushMessage(order.line_user_id,
            `✅ ยืนยันการชำระเงินคำสั่งซื้อ #${orderId} เรียบร้อยแล้วค่ะ\n\nทีมงานจะเริ่มผลิตสินค้าของคุณทันที และจะแจ้งให้ทราบเมื่อจัดส่ง 🎉`);
    }
}

// ─── Main webhook handler ─────────────────────────────────────────────────────

async function handleWebhook(req, res) {
    const signature = req.headers['x-line-signature'];
    const rawBody   = req.rawBody;

    if (!CHANNEL_SECRET || !CHANNEL_ACCESS_TOKEN) {
        console.error('[LINE] Missing LINE_CHANNEL_SECRET or LINE_CHANNEL_ACCESS_TOKEN');
        return res.status(500).end();
    }

    if (!signature || !verifySignature(rawBody, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    // Acknowledge immediately — LINE requires a fast 200 response
    res.status(200).end();

    const events = req.body.events || [];
    for (const event of events) {
        if (event.type !== 'message') continue;
        try {
            if (event.source.userId === ADMIN_USER_ID) {
                await handleAdminMessage(event);
            } else {
                await handleUserMessage(event);
            }
        } catch (err) {
            console.error('[LINE] Error handling event:', err?.response?.data || err.message);
        }
    }
}

module.exports = { handleWebhook };
