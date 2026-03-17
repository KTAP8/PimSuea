import { fabric } from 'fabric';
import { uploadFile } from '../services/api'; // Import our new API method

/**
 * Handles the high-resolution rendering and upload of the design for production.
 * This creates a snapshot of the canvas at the moment of "Add to Cart".
 *
 * @param canvas The Fabric.js canvas instance
 * @param userId The ID of the authenticated user
 * @returns The public URL of the uploaded image, or null if failed
 */
interface ExportOptions {
  crop?: { left: number; top: number; width: number; height: number };
  /** Physical dimensions of the print zone. When provided, the output is rendered at exactly 300 DPI. */
  physicalSize?: { w_cm: number; h_cm: number };
}

// CRC32 lookup table for PNG chunk CRC computation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Builds a 21-byte PNG pHYs chunk for the given DPI.
 */
function buildPhysChunk(dpi: number): Uint8Array {
  const ppm = Math.round(dpi / 0.0254); // 300 DPI → 11811 ppm
  const typeBytes = new Uint8Array([0x70, 0x48, 0x59, 0x73]); // 'pHYs'

  const data = new Uint8Array(9);
  const dv = new DataView(data.buffer);
  dv.setUint32(0, ppm);
  dv.setUint32(4, ppm);
  data[8] = 1; // unit = meter

  const typeAndData = new Uint8Array(13);
  typeAndData.set(typeBytes);
  typeAndData.set(data, 4);

  const chunk = new Uint8Array(21);
  const cdv = new DataView(chunk.buffer);
  cdv.setUint32(0, 9);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  cdv.setUint32(17, crc32(typeAndData));
  return chunk;
}

/**
 * Properly parses PNG chunks, removes any existing pHYs (browsers may embed 72/96 DPI),
 * and inserts a fresh pHYs with the target DPI right after IHDR.
 * canvas.toDataURL() never writes the correct pHYs even at high multipliers.
 */
function injectPngDpi(pngBytes: Uint8Array, dpi: number): Uint8Array {
  const physChunk = buildPhysChunk(dpi);
  const sig = pngBytes.slice(0, 8); // PNG signature

  // Parse chunks and collect them (dropping any existing pHYs)
  const chunks: Uint8Array[] = [];
  let offset = 8;
  while (offset + 8 <= pngBytes.length) {
    const dataLen = new DataView(pngBytes.buffer, pngBytes.byteOffset + offset).getUint32(0);
    const chunkLen = 4 + 4 + dataLen + 4; // length + type + data + CRC
    if (offset + chunkLen > pngBytes.length) break;

    const type = String.fromCharCode(
      pngBytes[offset + 4], pngBytes[offset + 5],
      pngBytes[offset + 6], pngBytes[offset + 7],
    );

    if (type !== 'pHYs') {
      chunks.push(pngBytes.slice(offset, offset + chunkLen));
    }
    // Insert our pHYs immediately after IHDR
    if (type === 'IHDR') {
      chunks.push(physChunk);
    }
    offset += chunkLen;
  }

  // Reassemble: signature + all chunks (IHDR, pHYs, rest…)
  const totalSize = sig.length + chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalSize);
  result.set(sig, 0);
  let pos = sig.length;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
}

export const exportDesignForProduction = async (
  canvas: fabric.Canvas | fabric.StaticCanvas,
  options?: ExportOptions
): Promise<string | null> => {
  try {
    // Step A: Clone & Clean
    let canvasToUse: fabric.Canvas | fabric.StaticCanvas = canvas;

    if (canvas instanceof fabric.Canvas) {
         const cloned = await new Promise<fabric.Canvas>((resolve) => {
            // IMPORTANT: Pass attributes to include in the clone, specifically 'name'
            canvas.clone((c: fabric.Canvas) => resolve(c), ['name']);
         });
         canvasToUse = cloned;
    } else {
         canvasToUse = canvas;
    }

    const clonedCanvas = canvasToUse;

    // Clean: Set background to transparent (null)
    clonedCanvas.setBackgroundColor(null as any, clonedCanvas.renderAll.bind(clonedCanvas));

    // IMPORTANT: Remove the "Shirt" background (static_bg) and the "Red Dotted Line" (print_zone)
    // We only want the actual design elements (text, images, etc.)
    const objectsToRemove = clonedCanvas.getObjects().filter(obj =>
        obj.name === 'static_bg' || obj.name === 'print_zone'
    );
    objectsToRemove.forEach(obj => clonedCanvas.remove(obj));

    clonedCanvas.renderAll();

    // Step B: Scale & Render at 300 DPI
    // multiplier = target_output_px / canvas_display_px
    // target_output_px = (physical_cm / 2.54) * 300
    const TARGET_DPI = 300;
    let multiplier = 4; // fallback when no physical size is provided

    if (options?.physicalSize && options?.crop) {
        const targetPxW = (options.physicalSize.w_cm / 2.54) * TARGET_DPI;
        multiplier = targetPxW / options.crop.width;
    }

    const toDataURLOptions: any = {
      format: 'png',
      multiplier,
      quality: 1,
    };

    if (options?.crop) {
        toDataURLOptions.left = options.crop.left;
        toDataURLOptions.top = options.crop.top;
        toDataURLOptions.width = options.crop.width;
        toDataURLOptions.height = options.crop.height;
    }

    const dataURL = clonedCanvas.toDataURL(toDataURLOptions);

    // Step C: Convert to Uint8Array and inject DPI metadata into PNG
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    const byteCharacters = atob(base64Data);
    const rawBytes = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        rawBytes[i] = byteCharacters.charCodeAt(i);
    }
    const pngWithDpi = injectPngDpi(rawBytes, TARGET_DPI);
    const blob = new Blob([pngWithDpi.buffer.slice(pngWithDpi.byteOffset, pngWithDpi.byteOffset + pngWithDpi.byteLength) as ArrayBuffer], { type: 'image/png' });

    // Step D: Upload to Backend (which handles Supabase)
    const suffix = Math.random().toString(36).substring(7);
    const fileName = `${suffix}_print_file.png`; // Backend will prepend timestamp

    const publicUrl = await uploadFile(blob, 'print', fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error in exportDesignForProduction:', error);
    return null;
  }
};

/**
 * Renders a saved side's canvas JSON to a PNG dataURL for mockup compositing.
 * Does NOT upload anything — returns a local dataURL for display only.
 */
export async function renderSideForMockup(
  savedJson: any,
  printZoneBounds: { left: number; top: number; width: number; height: number }
): Promise<string> {
  const el = document.createElement('canvas');
  const tempCanvas = new fabric.StaticCanvas(el);

  await new Promise<void>((resolve) => {
    tempCanvas.loadFromJSON(savedJson, () => resolve());
  });

  tempCanvas.getObjects()
    .filter((o: any) => o.name === 'static_bg' || o.name === 'print_zone')
    .forEach((o: any) => tempCanvas.remove(o));
  tempCanvas.setBackgroundColor(null as any, () => {});

  const dataUrl = tempCanvas.toDataURL({
    format: 'png',
    multiplier: 1,
    left: printZoneBounds.left,
    top: printZoneBounds.top,
    width: printZoneBounds.width,
    height: printZoneBounds.height,
  });

  tempCanvas.dispose();
  return dataUrl;
}
