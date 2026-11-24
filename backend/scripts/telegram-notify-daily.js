#!/usr/bin/env node
/**
 * Send Telegram alerts for paid orders not yet notified (last 24h + backlog).
 * Usage (from backend/): node scripts/telegram-notify-daily.js
 */
require('dotenv').config();

const { runTelegramPaidOrderDaily } = require('../src/jobs/telegramPaidOrderDaily');

runTelegramPaidOrderDaily()
  .then((result) => {
    console.log('Telegram daily notify complete:', result);
    process.exit(result.failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Telegram daily notify failed:', err);
    process.exit(1);
  });
