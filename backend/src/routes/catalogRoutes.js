
const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

router.get('/categories', catalogController.getCategories);
router.get('/products', catalogController.getProducts);
router.get('/products/:id', catalogController.getProductById);
router.get('/products/:id/templates', catalogController.getProductTemplates);

module.exports = router;
