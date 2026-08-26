const express = require('express');
const paymentController = require('../controllers/paymentController');

function stripeWebhookStack() {
  return [
    express.raw({ type: 'application/json' }),
    (req, _res, next) => {
      req.rawBody = req.body;
      next();
    },
    paymentController.handleStripeWebhook,
  ];
}

function attachStripeWebhook(app, path) {
  app.post(path, ...stripeWebhookStack());
}

module.exports = { attachStripeWebhook };
