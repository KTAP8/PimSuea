
const { r2, getPublicUrl, listObjects } = require('../config/r2Client');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { sanitizeFileName } = require('../utils/validate');

const ALLOWED_MIME = {
  preview: ['image/png', 'image/jpeg', 'image/webp'],
  print:   ['image/png', 'image/jpeg'],
  asset:   ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
};

exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const { type } = req.body;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const bucketType = ALLOWED_MIME[type] ? type : 'asset';
    if (!ALLOWED_MIME[bucketType].includes(file.mimetype)) {
      return res.status(400).json({ error: 'ประเภทไฟล์ไม่รองรับ' });
    }

    // Determine bucket and path based on type
    let bucketName = 'design-assets';
    let folder = 'uploads';

    if (type === 'preview') {
      bucketName = 'design-previews';
      folder = 'uid_' + userId;
    } else if (type === 'print') {
      bucketName = 'print-files';
      folder = 'uploads/' + userId;
    } else {
      bucketName = 'design-assets';
      folder = 'uploads/' + userId;
    }

    // Generate file name
    const timestamp = Date.now();
    let fileName = file.originalname;

    if (type === 'preview') {
      fileName = `${timestamp}_${fileName}`;
    } else if (type === 'print') {
      const suffix = Math.random().toString(36).substring(7);
      fileName = `${timestamp}_${suffix}_print_file.png`;
    } else {
      fileName = `${timestamp}_${fileName.replace(/\s+/g, '_')}`;
    }

    if (req.body.fileName) {
      // Keep timestamp prefix so each save produces a unique URL (prevents browser caching stale previews)
      fileName = `${timestamp}_${sanitizeFileName(req.body.fileName)}`;
    }

    const filePath = `${folder}/${fileName}`;

    console.log(`Uploading file to R2: ${bucketName}/${filePath}`);

    await r2.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const url = getPublicUrl(bucketName, filePath);

    res.json({
      message: 'File uploaded successfully',
      url,
      path: filePath,
    });

  } catch (error) {
    console.error('Upload controller error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
};

exports.listAssets = async (req, res) => {
  try {
    const userId = req.user.id;
    const prefix = `uploads/${userId}/`;
    const objects = await listObjects('design-assets', prefix);

    const files = objects
      .filter(obj => obj.Key !== prefix) // skip the folder placeholder if any
      .map(obj => ({
        name: obj.Key.replace(prefix, ''),
        url: getPublicUrl('design-assets', obj.Key),
      }))
      .sort((a, b) => b.name.localeCompare(a.name)); // newest first (timestamp prefix)

    res.json(files);
  } catch (error) {
    console.error('List assets error:', error);
    res.status(500).json({ error: error.message || 'Failed to list assets' });
  }
};
