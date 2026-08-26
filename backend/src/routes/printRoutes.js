const express = require('express');
const router = express.Router();
const printController = require('../controllers/printController');
const requireAuth = require('../middleware/requireAuth');

router.post('/compose', requireAuth, printController.composePrintFiles);

module.exports = router;
