const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/lineController');

// req.rawBody is set by the express.json verify callback in index.js
router.post('/webhook', handleWebhook);

module.exports = router;
