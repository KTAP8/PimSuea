const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUUID = (v) => typeof v === 'string' && UUID_RE.test(v);

const isPositiveInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
};

// Strip path traversal sequences and dangerous characters from filenames
const sanitizeFileName = (name) =>
  name
    .replace(/[/\\?%*:|"<>\0]/g, '_')
    .replace(/\.\.+/g, '_')
    .slice(0, 200);

module.exports = { isUUID, isPositiveInt, sanitizeFileName };
