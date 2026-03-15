const { S3Client } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Public base URLs per bucket (set via env vars after enabling R2.dev subdomain)
const R2_PUBLIC_URLS = {
  'design-previews': process.env.R2_PUBLIC_URL_PREVIEWS,
  'print-files':     process.env.R2_PUBLIC_URL_PRINT,
  'design-assets':   process.env.R2_PUBLIC_URL_ASSETS,
};

/**
 * Returns the public URL for a given bucket + file path.
 * @param {string} bucketName
 * @param {string} filePath
 */
function getPublicUrl(bucketName, filePath) {
  const base = R2_PUBLIC_URLS[bucketName];
  if (!base) throw new Error(`No public URL configured for bucket: ${bucketName}`);
  return `${base}/${filePath}`;
}

module.exports = { r2, getPublicUrl };
