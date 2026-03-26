const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/lineController');

// LINE sends requests as application/json — we need the raw body for signature verification.
// express.raw() captures it before JSON parsing; we then parse manually and attach to req.body.
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
        req.rawBody = req.body; // Buffer at this point
        try {
            req.body = JSON.parse(req.body.toString('utf8'));
        } catch {
            req.body = {};
        }
        next();
    },
    handleWebhook
);

module.exports = router;
