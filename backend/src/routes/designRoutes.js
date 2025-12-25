
const express = require('express');
const router = express.Router();
const designController = require('../controllers/designController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, designController.getUserDesigns);
router.get('/:id', requireAuth, designController.getDesignById);
router.post('/', requireAuth, designController.saveDesign);
router.put('/:id', requireAuth, designController.updateDesign);

module.exports = router;
