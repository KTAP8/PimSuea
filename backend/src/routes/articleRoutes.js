const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// GET /api/articles/:id
router.get('/:id', articleController.getArticleById);

module.exports = router;
