const sharp = require('sharp');
const {
  getLocationFromUrl,
  getPublicUrl,
  getObjectBuffer,
  putObject,
  normalizePublicUrl,
} = require('../config/r2Client');

const PRINT_DPI = 300;
const CM_PER_IN = 2.54;
const DEFAULT_PHYS_W_CM = 30.48;
const DEFAULT_PHYS_H_CM = 40.64;

function cmToPrintPx(cm) {
  return Math.round((Number(cm) / CM_PER_IN) * PRINT_DPI);
}

/**
 * @param {string} src
 * @param {string} userId
 * @returns {Promise<Buffer>}
 */
async function loadLayerAsset(src, userId) {
  const normalized = normalizePublicUrl(src);
  const loc = getLocationFromUrl(normalized);
  if (!loc) {
    throw new Error(`Unrecognized asset URL: ${src}`);
  }
  if (loc.bucket !== 'design-assets') {
    throw new Error('Print layers must reference design-assets uploads');
  }
  const prefix = `uploads/${userId}/`;
  if (!loc.key.startsWith(prefix) || loc.key.includes('..')) {
    throw new Error('Asset not accessible for this user');
  }
  return getObjectBuffer(loc.bucket, loc.key);
}

/**
 * Resize + optional rotation (Konva top-left anchor) for one layer.
 * @param {Buffer} buffer
 * @param {{ relX: number, relY: number, relW: number, relH: number, rotation?: number }} layer
 * @param {number} canvasW
 * @param {number} canvasH
 */
async function prepareLayerComposite(buffer, layer, canvasW, canvasH) {
  const w = Math.max(1, Math.round(Number(layer.relW) * canvasW));
  const h = Math.max(1, Math.round(Number(layer.relH) * canvasH));
  const x = Math.round(Number(layer.relX) * canvasW);
  const y = Math.round(Number(layer.relY) * canvasH);
  const rotation = Number(layer.rotation) || 0;

  let pipeline = sharp(buffer)
    .ensureAlpha()
    .resize(w, h, { kernel: sharp.kernel.lanczos3, fit: 'fill' });

  let layerBuf;
  if (rotation !== 0) {
    const theta = (rotation * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    layerBuf = await pipeline
      .affine([[cos, -sin, 0], [sin, cos, 0]], {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  } else {
    layerBuf = await pipeline.png().toBuffer();
  }

  return { input: layerBuf, left: x, top: y };
}

/**
 * @param {{ physical_w_cm?: number, physical_h_cm?: number, layers: object[] }} sideConfig
 * @param {string} userId
 * @returns {Promise<Buffer>}
 */
async function composeSidePrint(sideConfig, userId) {
  const layers = sideConfig?.layers;
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new Error('Side has no layers');
  }

  for (const layer of layers) {
    if (
      layer.relX == null || layer.relY == null ||
      layer.relW == null || layer.relH == null ||
      !layer.src
    ) {
      throw new Error('Each layer requires src, relX, relY, relW, relH');
    }
  }

  const physW = sideConfig.physical_w_cm ?? DEFAULT_PHYS_W_CM;
  const physH = sideConfig.physical_h_cm ?? DEFAULT_PHYS_H_CM;
  const canvasW = cmToPrintPx(physW);
  const canvasH = cmToPrintPx(physH);

  const composites = [];
  for (const layer of layers) {
    const assetBuf = await loadLayerAsset(layer.src, userId);
    composites.push(await prepareLayerComposite(assetBuf, layer, canvasW, canvasH));
  }

  return sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .withMetadata({ density: PRINT_DPI })
    .toBuffer();
}

/**
 * Compose all sides and upload to print-files.
 * @param {Record<string, object>} sides
 * @param {string} userId
 * @returns {Promise<Record<string, string>>}
 */
async function composeAndUploadPrintFiles(sides, userId) {
  if (!sides || typeof sides !== 'object') {
    throw new Error('Missing sides');
  }

  const urls = {};
  for (const [sideName, config] of Object.entries(sides)) {
    if (!config?.layers?.length) continue;

    const png = await composeSidePrint(config, userId);
    const suffix = Math.random().toString(36).substring(7);
    const key = `uploads/${userId}/${Date.now()}_${suffix}_print_file.png`;
    await putObject('print-files', key, png, 'image/png');
    urls[sideName.toLowerCase()] = getPublicUrl('print-files', key);
  }

  if (Object.keys(urls).length === 0) {
    throw new Error('No printable sides provided');
  }

  return urls;
}

module.exports = {
  composeSidePrint,
  composeAndUploadPrintFiles,
  cmToPrintPx,
  PRINT_DPI,
};
