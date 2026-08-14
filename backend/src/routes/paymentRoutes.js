const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const paymentController = require('../controllers/paymentController');

router.post('/checkout-session', requireAuth, paymentController.createCheckoutSession);
router.get('/session/:sessionId', requireAuth, paymentController.getCheckoutSessionStatus);

module.exports = router;
