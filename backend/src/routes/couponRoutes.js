const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const couponController = require('../controllers/couponController');

router.get('/validate', requireAuth, couponController.validateCoupon);

module.exports = router;
