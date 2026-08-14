const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/', express.raw({ type: 'application/json' }), (req, _res, next) => {
  req.rawBody = req.body;
  next();
}, paymentController.handleStripeWebhook);

module.exports = router;
