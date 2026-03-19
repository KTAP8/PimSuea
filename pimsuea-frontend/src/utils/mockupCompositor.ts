export interface MockupPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Scale the entire composition up so the design placement area has enough
// pixels to look sharp. 3× means a 752px background becomes 2256px output.
const OUTPUT_SCALE = 3;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function compositeSingleSide(
  mockupImageUrl: string,
  placement: MockupPlacement,
  designDataUrl: string
): Promise<string> {
  const [bg, design] = await Promise.all([
    loadImage(mockupImageUrl),
    loadImage(designDataUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = bg.naturalWidth * OUTPUT_SCALE;
  canvas.height = bg.naturalHeight * OUTPUT_SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    design,
    placement.x * OUTPUT_SCALE,
    placement.y * OUTPUT_SCALE,
    placement.w * OUTPUT_SCALE,
    placement.h * OUTPUT_SCALE,
  );

  return canvas.toDataURL('image/png');
}

export { OUTPUT_SCALE };

// ─── Admin Annotated Mockup ────────────────────────────────────────────────
// Generates a version of the mockup with measurement overlay for admin use.
// Never shown to customers — saved to order_items.annotated_preview_url.

export async function generateAnnotatedMockup(
  previewImageUrl: string,
  printDimensions: {
    px_x: number; px_y: number;
    px_w: number; px_h: number;
    x_cm: number; y_cm: number;
    w: number;    h: number;
  },
  printAreaConfig: {
    width: number; height: number;
    physical_w_cm?: number;
  },
  placement: MockupPlacement,
  collarY = 201,
): Promise<string> {
  const S = OUTPUT_SCALE; // the existing preview is already rendered at 3×

  const preview = await loadImage(previewImageUrl);
  const canvas = document.createElement('canvas');
  canvas.width  = preview.naturalWidth;
  canvas.height = preview.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Base layer
  ctx.drawImage(preview, 0, 0);

  const { px_x, px_y, px_w, px_h, x_cm, y_cm, w: w_cm } = printDimensions;
  const { width: zoneW, height: zoneH, physical_w_cm } = printAreaConfig;

  // Map design bounding box → composited image coordinates
  const dX = (placement.x + (px_x / zoneW) * placement.w) * S;
  const dY = (placement.y + (px_y / zoneH) * placement.h) * S;
  const dW = (px_w / zoneW) * placement.w * S;
  const dH = (px_h / zoneH) * placement.h * S;

  const zoneCenterX  = (placement.x + placement.w / 2) * S;
  const designCenterX = dX + dW / 2;
  const collarYpx    = collarY * S;

  const physW       = physical_w_cm ?? 0;
  const offsetCm    = physW > 0 ? (x_cm + w_cm / 2) - physW / 2 : 0;
  const collarDistCm = y_cm + 7.62; // 3 inches from collar to print zone top

  const DASH   = [10 * S, 7 * S];
  const TICK   = 12 * S;
  const PAD    = 20 * S;
  const ORANGE = '#FF6B35';
  const LW     = 2 * S;

  // Helper: draw dashed stroke
  const dash = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  // Helper: label with black shadow
  const label = (text: string, x: number, y: number) => {
    ctx.save();
    ctx.font = `bold ${14 * S}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pad = 4 * S;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(x - tw / 2 - pad, y - 10 * S, tw + pad * 2, 20 * S);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  ctx.strokeStyle = ORANGE;
  ctx.lineWidth   = LW;

  // 1. Dotted bounding box
  ctx.setLineDash(DASH);
  ctx.strokeRect(dX, dY, dW, dH);

  // 2. Horizontal offset line (above the design)
  const hLineY = dY - PAD;
  ctx.setLineDash(DASH);
  dash(zoneCenterX, hLineY, designCenterX, hLineY);
  ctx.setLineDash([]);
  dash(zoneCenterX,   hLineY - TICK / 2, zoneCenterX,   hLineY + TICK / 2);
  dash(designCenterX, hLineY - TICK / 2, designCenterX, hLineY + TICK / 2);

  const hText = Math.abs(offsetCm) < 0.3
    ? 'Center'
    : `${Math.abs(offsetCm).toFixed(1)} cm ${offsetCm > 0 ? 'right' : 'left'}`;
  label(hText, (zoneCenterX + designCenterX) / 2, hLineY - 16 * S);

  // 3. Collar-to-design vertical line (right of the design)
  const vLineX = dX + dW + PAD;
  ctx.setLineDash(DASH);
  dash(vLineX, collarYpx, vLineX, dY);
  ctx.setLineDash([]);
  dash(vLineX - TICK / 2, collarYpx, vLineX + TICK / 2, collarYpx);
  dash(vLineX - TICK / 2, dY,        vLineX + TICK / 2, dY);

  const vText = `${collarDistCm.toFixed(1)} cm from collar`;
  ctx.save();
  ctx.font = `bold ${14 * S}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const midY = (collarYpx + dY) / 2;
  const tw = ctx.measureText(vText).width;
  const pad = 4 * S;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(vLineX + pad, midY - 10 * S, tw + pad * 2, 20 * S);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(vText, vLineX + pad * 2, midY);
  ctx.restore();

  return canvas.toDataURL('image/png');
}
