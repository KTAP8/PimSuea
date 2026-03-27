const express = require('express');
const router = express.Router();
const { signup, notify, sendCoupon } = require('../controllers/waitlistController');
const requireAuth = require('../middleware/requireAuth');

router.post('/', signup);
router.post('/notify', requireAuth, notify);
router.post('/send-coupon', requireAuth, sendCoupon);

module.exports = router;
