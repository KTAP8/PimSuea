
const express = require('express');
const router = express.Router();
const designController = require('../controllers/designController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, designController.getUserDesigns);
router.post('/', requireAuth, designController.saveDesign);

module.exports = router;
