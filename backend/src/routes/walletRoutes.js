
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const requireAuth = require('../middleware/requireAuth');

router.get('/transactions', requireAuth, walletController.getTransactions);

module.exports = router;
