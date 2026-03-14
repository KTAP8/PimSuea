const rateLimit = require('express-rate-limit');

// General limiter: all API routes — 200 req per 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'คำขอมากเกินไป กรุณาลองใหม่ในอีกสักครู่' },
});

// Strict limiter: public unauthenticated endpoints — 20 req per 15 min per IP
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'คำขอมากเกินไป กรุณาลองใหม่ในอีกสักครู่' },
});

module.exports = { generalLimiter, strictLimiter };
