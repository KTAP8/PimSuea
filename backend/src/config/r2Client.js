const { S3Client, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand } = require('@aws-sdk/client-s3');

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
  'design-previews':   process.env.R2_PUBLIC_URL_PREVIEWS,
  'print-files':       process.env.R2_PUBLIC_URL_PRINT,
  'design-assets':     process.env.R2_PUBLIC_URL_ASSETS,
  'print-files-ordered': process.env.R2_PUBLIC_URL_PRINT_ORDERED,
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

/**
 * Rewrites stored URLs that used a wrong public base (e.g. Supabase S3 endpoint)
 * back to the configured R2 public URL when the object key is recognizable.
 * @param {string} url
 * @returns {string}
 */
function normalizePublicUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (getLocationFromUrl(url)) return url;

  const previewMatch = url.match(/\/(uid_[^/?#]+\/[^/?#]+)$/);
  if (previewMatch && R2_PUBLIC_URLS['design-previews']) {
    return `${R2_PUBLIC_URLS['design-previews']}/${previewMatch[1]}`;
  }

  const uploadsMatch = url.match(/\/(uploads\/[^/?#]+\/[^/?#]+)$/);
  if (uploadsMatch) {
    for (const bucket of ['print-files', 'design-assets']) {
      const base = R2_PUBLIC_URLS[bucket];
      if (base) return `${base}/${uploadsMatch[1]}`;
    }
  }

  return url;
}

/**
 * Normalizes preview/print URL fields stored as JSON maps or plain strings.
 * @param {string|null|undefined} raw
 * @returns {string|null|undefined}
 */
function normalizeStoredUrlField(raw) {
  if (!raw) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const fixed = Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, normalizePublicUrl(String(v))])
      );
      return JSON.stringify(fixed);
    }
  } catch { /* plain URL */ }
  return normalizePublicUrl(raw);
}

/**
 * Resolves a public URL back to { bucket, key } by matching against known base URLs.
 * Returns null if the URL doesn't match any configured bucket.
 * @param {string} url
 * @returns {{ bucket: string, key: string } | null}
 */
function getLocationFromUrl(url) {
  for (const [bucket, base] of Object.entries(R2_PUBLIC_URLS)) {
    if (base && url.startsWith(base + '/')) {
      return { bucket, key: url.slice(base.length + 1) };
    }
  }
  return null;
}

/**
 * Deletes an object from R2 given its bucket + key.
 * @param {string} bucketName
 * @param {string} key
 */
async function deleteObject(bucketName, key) {
  await r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

/**
 * Lists objects in a bucket under a given prefix.
 * @param {string} bucketName
 * @param {string} prefix
 * @returns {Promise<import('@aws-sdk/client-s3')._Object[]>}
 */
async function listObjects(bucketName, prefix) {
  const cmd = new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix });
  const res = await r2.send(cmd);
  return res.Contents ?? [];
}

/**
 * Copies an object between R2 buckets.
 * @param {string} srcBucket
 * @param {string} srcKey
 * @param {string} dstBucket
 * @param {string} dstKey
 */
async function copyObject(srcBucket, srcKey, dstBucket, dstKey) {
  await r2.send(new CopyObjectCommand({
    Bucket: dstBucket,
    CopySource: `${srcBucket}/${encodeURIComponent(srcKey)}`,
    Key: dstKey,
  }));
}

module.exports = { r2, getPublicUrl, getLocationFromUrl, deleteObject, listObjects, copyObject, normalizePublicUrl, normalizeStoredUrlField };
