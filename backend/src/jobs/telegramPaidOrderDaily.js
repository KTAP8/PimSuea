const cron = require('node-cron');
const { supabaseAdmin } = require('../config/supabaseClient');
const { notifyPaidOrder, sendMessage } = require('../services/telegramNotify');

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

  if (summary.found === 0) {
    try {
      const day = new Date().toLocaleDateString('en-GB', {
        timeZone: BANGKOK,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      await sendMessage(`No orders today.\n${day}`);
      summary.emptyDigest = true;
    } catch (err) {
      console.error('[telegramPaidOrderDaily] empty digest failed', err.message);
      summary.failed += 1;
    }
  }

  console.log('[telegramPaidOrderDaily] done', summary);
  return summary;
}

function bangkokDate(date) {
  return date.toLocaleDateString('en-CA', { timeZone: BANGKOK });
}

function runDailyQuiet(reason) {
  console.log('[telegramPaidOrderDaily] running', reason);
  runTelegramPaidOrderDaily().catch((err) => {
    console.error('[telegramPaidOrderDaily] unhandled error:', err);
  });
}

function startTelegramPaidOrderDailyJob() {
  const task = cron.schedule(CRON_NOON_BANGKOK, () => {
    runDailyQuiet('scheduled noon');
  }, { timezone: BANGKOK });

  const next = task.getNextRun();
  console.log(
    '[telegramPaidOrderDaily] scheduled 12:00 Asia/Bangkok, next',
    next ? next.toISOString() : 'unknown',
  );

  // Deploy/wake after 12:00 would otherwise wait until tomorrow.
  if (next && bangkokDate(next) !== bangkokDate(new Date())) {
    runDailyQuiet('missed noon catch-up');
  }
}

module.exports = {
  findOrdersPendingTelegramNotify,
  runTelegramPaidOrderDaily,
  startTelegramPaidOrderDailyJob,
};
