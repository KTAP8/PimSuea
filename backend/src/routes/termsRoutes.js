const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const termsController = require('../controllers/termsController');

router.post('/accept', requireAuth, termsController.acceptTerms);

module.exports = router;
