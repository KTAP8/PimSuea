
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, orderController.getUserOrders);
router.get('/:id', requireAuth, orderController.getOrderDetails);

// Legacy direct order creation — replaced by Stripe Checkout
router.post('/', requireAuth, orderController.createOrder);

router.put('/:id', requireAuth, orderController.updateOrder);

module.exports = router;
