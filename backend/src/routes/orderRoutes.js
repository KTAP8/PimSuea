
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, orderController.getUserOrders);
router.get('/:id', requireAuth, orderController.getOrderDetails);

module.exports = router;
