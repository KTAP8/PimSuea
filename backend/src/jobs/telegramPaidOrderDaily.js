const cron = require('node-cron');
const { supabaseAdmin } = require('../config/supabaseClient');
const { notifyPaidOrder } = require('../services/telegramNotify');

const CRON_NOON_BANGKOK = '0 12 * * *';
const BANGKOK = 'Asia/Bangkok';
const DEFAULT_WITHIN_HOURS = 24;
const DEFAULT_LIMIT = 20;

async function findOrdersPendingTelegramNotify({
  withinHours = DEFAULT_WITHIN_HOURS,
  includeBacklog = true,
  limit = DEFAULT_LIMIT,
} = {}) {
  if (!supabaseAdmin) return [];

  let query = supabaseAdmin
    .from('orders')
    .select('id, paid_at')
    .not('paid_at', 'is', null)
    .is('ops_notified_at', null)
    .order('paid_at', { ascending: true })
    .limit(limit);

  if (!includeBacklog) {
    const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
    query = query.gte('paid_at', cutoff);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function runTelegramPaidOrderDaily() {
  const summary = { found: 0, sent: 0, skipped: 0, failed: 0 };

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log('[telegramPaidOrderDaily] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing — skipping');
    return { ...summary, reason: 'not_configured' };
  }
  if (!supabaseAdmin) {
    console.log('[telegramPaidOrderDaily] supabaseAdmin not configured — skipping');
    return { ...summary, reason: 'not_configured' };
  }

  const orders = await findOrdersPendingTelegramNotify();
  summary.found = orders.length;

  for (const order of orders) {
    const result = await notifyPaidOrder(order.id);
    if (result?.sent) {
      summary.sent += 1;
    } else if (result?.reason === 'send_failed') {
      summary.failed += 1;
    } else {
      summary.skipped += 1;
    }
  }

  console.log('[telegramPaidOrderDaily] done', summary);
  return summary;
}

function startTelegramPaidOrderDailyJob() {
  cron.schedule(CRON_NOON_BANGKOK, () => {
    runTelegramPaidOrderDaily().catch((err) => {
      console.error('[telegramPaidOrderDaily] unhandled error:', err);
    });
  }, { timezone: BANGKOK });

  console.log('[telegramPaidOrderDaily] scheduled 12:00 Asia/Bangkok');
}

module.exports = {
  findOrdersPendingTelegramNotify,
  runTelegramPaidOrderDaily,
  startTelegramPaidOrderDailyJob,
};
