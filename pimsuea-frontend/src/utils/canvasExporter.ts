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
export function injectPngDpi(pngBytes: Uint8Array, dpi: number): Uint8Array<ArrayBuffer> {
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
