export interface MockupPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Longest side of the customer-facing mockup (share / download). */
export const MOCKUP_LONG_EDGE = 1600;

const JPEG_QUALITY = 0.88;

export function mockupOutputScale(bgNaturalWidth: number, bgNaturalHeight: number): number {
  const longEdge = Math.max(bgNaturalWidth, bgNaturalHeight, 1);
  return MOCKUP_LONG_EDGE / longEdge;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function loadMockupBackground(mockupImageUrl: string): Promise<HTMLImageElement> {
  return loadImage(mockupImageUrl);
}

export async function compositeSingleSide(
  mockupImageUrl: string,
  placement: MockupPlacement,
  designDataUrl: string,
  preloadedBackground?: HTMLImageElement,
): Promise<string> {
  const bg = preloadedBackground ?? await loadImage(mockupImageUrl);
  const design = await loadImage(designDataUrl);

  const scale = mockupOutputScale(bg.naturalWidth, bg.naturalHeight);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bg.naturalWidth * scale);
  canvas.height = Math.round(bg.naturalHeight * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    design,
    placement.x * scale,
    placement.y * scale,
    placement.w * scale,
    placement.h * scale,
  );

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
