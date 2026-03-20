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
