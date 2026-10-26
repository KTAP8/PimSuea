const { supabaseAdmin } = require('../config/supabaseClient');

const BANGKOK = 'Asia/Bangkok';
const MAX_TEXT = 4000;

function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `฿${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatPaidAt(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleString('en-GB', {
    timeZone: BANGKOK,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPaymentMethod(method) {
  if (method === 'stripe_promptpay') return 'PromptPay';
  if (method === 'stripe_card') return 'Card';
  return method || '—';
}

function line(label, value) {
  const text = value == null || value === '' ? '—' : String(value);
  return `${label}: ${text}`;
}

function formatAddress(addr) {
  if (!addr || typeof addr !== 'object') return '—';
  const parts = [
    addr.addressLine1 ?? addr.address_line1,
    addr.addressLine2 ?? addr.address_line2,
    addr.district,
    addr.province,
    addr.postalCode ?? addr.postal_code,
  ].map((part) => (part == null ? '' : String(part).trim())).filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function printSides(printFileUrl) {
  if (!printFileUrl) return '';
  if (typeof printFileUrl === 'object') {
    return Object.keys(printFileUrl).filter(Boolean).join(', ');
  }
  try {
    const parsed = JSON.parse(printFileUrl);
    if (parsed && typeof parsed === 'object') {
      return Object.keys(parsed).filter(Boolean).join(', ');
    }
  } catch {
    return 'front';
  }
  return '';
}

function itemFromPayload(item) {
  const recipient = item.normalizedRecipient || null;
  return {
    designName: item.designName || item.design_name || '',
    productName: item.productName || item.product_name || '',
    color: item.color || item.color_id || '',
    size: item.size || '',
    quantity: item.quantity,
    unitPrice: item.verifiedUnitPrice ?? item.unit_price,
    isGift: Boolean(item.is_gift),
    giftMessage: item.gift_message || '',
    recipient,
    sides: printSides(item.print_file_url),
  };
}

function formatRecipient(recipient) {
  if (!recipient) return '';
  const name = recipient.full_name || recipient.fullName || '';
  const phone = recipient.phone || '';
  const address = formatAddress({
    addressLine1: recipient.address_line1 || recipient.addressLine1,
    addressLine2: recipient.address_line2 || recipient.addressLine2,
    district: recipient.district,
    province: recipient.province,
    postalCode: recipient.postal_code || recipient.postalCode,
  });
  return [name, phone, address].filter((part) => part && part !== '—').join(' · ');
}

function formatOrderMessage({ order, items }) {
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const lines = [
    'New paid order',
    line('Order', order.id),
    line('Paid', formatPaidAt(order.paid_at)),
    line('Total', formatMoney(order.total_amount)),
    line('Items', itemCount),
    line('Payment', formatPaymentMethod(order.payment_method)),
    line('Name', order.shipping_address?.fullName || order.shipping_address?.full_name),
    line('Phone', order.shipping_address?.phone),
    line('Ship to', formatAddress(order.shipping_address)),
  ];

  if (Number(order.delivery_fee) > 0) {
    lines.push(line('Delivery', formatMoney(order.delivery_fee)));
  }
  if (Number(order.discount_amount) > 0) {
    const coupon = order.coupon_code ? ` (${order.coupon_code})` : '';
    lines.push(line('Discount', `${formatMoney(order.discount_amount)}${coupon}`));
  }

  items.forEach((item, index) => {
    lines.push('');
    lines.push(`${index + 1}. ${item.designName || 'Design'}${item.isGift ? ' · GIFT' : ''}`);
    lines.push(line('Product', item.productName));
    lines.push(line('Color', item.color));
    lines.push(line('Size', item.size));
    lines.push(line('Qty', item.quantity));
    lines.push(line('Unit', formatMoney(item.unitPrice)));
    if (item.sides) lines.push(line('Print', item.sides));
    if (item.isGift) {
      lines.push(line('Gift to', formatRecipient(item.recipient)));
      if (item.giftMessage) lines.push(line('Card', item.giftMessage));
    }
  });

  const text = lines.join('\n');
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}

async function loadDraftItems(orderId) {
  const { data, error } = await supabaseAdmin
    .from('checkout_drafts')
    .select('payload')
    .eq('order_id', orderId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const items = data?.payload?.giftEnrichedItems;
  if (!Array.isArray(items) || items.length === 0) return null;
  return items.map(itemFromPayload);
}

async function loadDbItems(orderId) {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select('size, color, quantity, unit_price, print_file_url, is_gift, gift_message, user_design_id, gift_recipient_id')
    .eq('order_id', orderId);
  if (error) throw error;
  const rows = data || [];

  const designIds = [...new Set(rows.map((row) => row.user_design_id).filter(Boolean))];
  const recipientIds = [...new Set(rows.map((row) => row.gift_recipient_id).filter(Boolean))];

  const designsById = {};
  if (designIds.length) {
    const { data: designs, error: designErr } = await supabaseAdmin
      .from('user_designs')
      .select('id, design_name, base_product_id')
      .in('id', designIds);
    if (designErr) throw designErr;
    const productIds = [...new Set((designs || []).map((row) => row.base_product_id).filter(Boolean))];
    const titlesById = {};
    if (productIds.length) {
      const { data: products, error: productErr } = await supabaseAdmin
        .from('products')
        .select('id, title')
        .in('id', productIds);
      if (productErr) throw productErr;
      for (const product of products || []) titlesById[product.id] = product.title;
    }
    for (const design of designs || []) {
      designsById[design.id] = {
        designName: design.design_name,
        productName: titlesById[design.base_product_id] || '',
      };
    }
  }

  const recipientsById = {};
  if (recipientIds.length) {
    const { data: recipients, error: recipientErr } = await supabaseAdmin
      .from('gift_recipients')
      .select('id, full_name, phone, address_line1, address_line2, district, province, postal_code')
      .in('id', recipientIds);
    if (recipientErr) throw recipientErr;
    for (const recipient of recipients || []) recipientsById[recipient.id] = recipient;
  }

  return rows.map((row) => itemFromPayload({
    designName: designsById[row.user_design_id]?.designName,
    productName: designsById[row.user_design_id]?.productName,
    color: row.color,
    size: row.size,
    quantity: row.quantity,
    unit_price: row.unit_price,
    print_file_url: row.print_file_url,
    is_gift: row.is_gift,
    gift_message: row.gift_message,
    normalizedRecipient: recipientsById[row.gift_recipient_id],
  }));
}

async function sendMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    const detail = body.description || response.statusText || 'send failed';
    throw new Error(detail);
  }
}

/**
 * Send one paid-order alert. Never throws. Skips when env is missing or already sent.
 */
async function notifyPaidOrder(orderId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing — skipping');
    return { sent: false, reason: 'not_configured' };
  }
  if (!supabaseAdmin || !orderId) {
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, delivery_fee, discount_amount, coupon_code, payment_method, paid_at, shipping_address, ops_notified_at')
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw error;
    if (!order) return { sent: false, reason: 'missing_order' };
    if (order.ops_notified_at) return { sent: false, reason: 'already_notified' };

    const items = (await loadDraftItems(orderId)) || (await loadDbItems(orderId));
    const text = formatOrderMessage({ order, items });
    await sendMessage(text);

    const { error: stampErr } = await supabaseAdmin
      .from('orders')
      .update({ ops_notified_at: new Date().toISOString() })
      .eq('id', orderId)
      .is('ops_notified_at', null);
    if (stampErr) {
      console.error('[telegram] sent but failed to stamp ops_notified_at', orderId, stampErr.message);
    }
    return { sent: true };
  } catch (err) {
    console.error('[telegram] notify failed', orderId, err.message);
    return { sent: false, reason: 'send_failed' };
  }
}

module.exports = {
  notifyPaidOrder,
  formatOrderMessage,
  formatPaymentMethod,
};
