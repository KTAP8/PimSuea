export interface MockupPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
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
  canvas.width = bg.naturalWidth;
  canvas.height = bg.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(bg, 0, 0);
  ctx.drawImage(design, placement.x, placement.y, placement.w, placement.h);

  return canvas.toDataURL('image/png');
}
