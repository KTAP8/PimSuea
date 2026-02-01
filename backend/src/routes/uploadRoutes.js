
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const requireAuth = require('../middleware/requireAuth');
const multer = require('multer');

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Limit 50MB
});

// Route: POST /api/uploads
// Expects 'file' field in multipart/form-data
router.post('/', requireAuth, upload.single('file'), uploadController.uploadFile);

module.exports = router;
