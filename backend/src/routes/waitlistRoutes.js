const express = require('express');
const router = express.Router();
const { signup, notify } = require('../controllers/waitlistController');
const requireAuth = require('../middleware/requireAuth');

router.post('/', signup);
router.post('/notify', requireAuth, notify);

module.exports = router;
