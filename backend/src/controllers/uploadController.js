
const { supabaseAdmin } = require('../config/supabaseClient');
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
    let bucketName = 'design-assets'; // default
    let folder = 'uploads';

    if (type === 'preview') {
      bucketName = 'design-previews';
      folder = 'uid_' + userId; // Matches existing logic: uid_{userId}/{timestamp}_{side}.png
    } else if (type === 'print') {
      bucketName = 'print-files';
      folder = 'uploads/' + userId; // Matches existing logic: uploads/{userId}/{timestamp}_{suffix}.png
    } else {
       // Default logic for 'asset' or unknown types, mapped to design-assets
       bucketName = 'design-assets';
       folder = 'uploads/' + userId;
    }

    // Generate file path
    // We try to preserver original name or generate a new one
    // Existing logic used timestamps.
    const timestamp = Date.now();
    
    let fileName = file.originalname;
    // If it's a blob from frontend (blob), originalname might be 'blob' or similar.
    // Let's generate a name if needed or use the one provided.
    
    // For previews/print files, we usually want to generate a unique name
    if (type === 'preview') {
         // Expecting client to maybe hint the side? Or we just generate 
         // logic: `${timestamp}_${currentTemplate.side}.png`
         // We can accept a specific filename in body if needed, or just auto-generate.
         // Let's use the original name if valid, or fallback.
         fileName = `${timestamp}_${fileName}`; 
    } else if (type === 'print') {
         const suffix = Math.random().toString(36).substring(7);
         fileName = `${timestamp}_${suffix}_print_file.png`;
    } else {
         fileName = `${timestamp}_${fileName.replace(/\s+/g, '_')}`;
    }

    // Allow overriding filename from body if strictly required (e.g. knowing the side)
    if (req.body.fileName) {
        fileName = sanitizeFileName(req.body.fileName);
    }

    const filePath = `${folder}/${fileName}`;

    console.log(`Uploading file to ${bucketName}/${filePath}`);

    // Read file buffer
    const fileBuffer = file.buffer;

    // Upload using Supabase Admin (Bypass RLS for upload to ensure it works, 
    // or use authenticated client if we want to enforce RLS policies defined in DB.
    // Given the prompt "not safe... calling API directly", using Admin here is "safer" 
    // in the sense that backend controls it, but "unsafe" if we bypass logical checks.
    // Using authenticated client is best for RLS consistency.)
    
    // NOTE: Supabase JS Client 'storage.from().upload()' takes a File object, Blob, or Buffer.
    // When using supabase-js in Node, Buffer matches 'ArrayBuffer' compatible types.

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get Public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    res.json({ 
        message: 'File uploaded successfully', 
        url: publicUrlData.publicUrl,
        path: filePath 
    });

  } catch (error) {
    console.error('Upload controller error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
};
