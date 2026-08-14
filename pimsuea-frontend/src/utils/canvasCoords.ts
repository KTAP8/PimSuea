import type { CanvasImage, SerializableImage } from '../types/canvas';

export type PrintZoneRect = { left: number; top: number; width: number; height: number };

export interface CanvasDataMeta {
    version?: string;
    stageScaleFactor?: number;
}

export interface DeserializeOpts extends CanvasDataMeta {
    imgW: number;
    imgH: number;
    sfLoad: number;
}

/** Scale-invariant coords relative to the print zone (v3). */
export function serializeCanvasImage(ci: CanvasImage, zone: PrintZoneRect): SerializableImage {
    return {
        id: ci.id,
        src: ci.src,
        rotation: ci.rotation ?? 0,
        relX: (ci.x - zone.left) / zone.width,
        relY: (ci.y - zone.top) / zone.height,
        relW: ci.width / zone.width,
        relH: ci.height / zone.height,
    };
}

/** Guess save-time stage scale for legacy v2 designs (no stageScaleFactor stored). */
export function inferSaveScaleFactor(images: SerializableImage[], imgW: number, imgH: number): number {
    let maxR = 0;
    for (const d of images) {
        if (d.x == null || d.y == null) continue;
        maxR = Math.max(
            maxR,
            (d.x + (d.width ?? 0)) / imgW,
            (d.y + (d.height ?? 0)) / imgH,
        );
    }
    if (maxR <= 0) return 1;
    return Math.min(maxR / 0.95, 1);
}

/** Convert stored image data to stage pixel coords for the current viewport scale. */
export function deserializeCanvasCoords(
    d: SerializableImage,
    zone: PrintZoneRect,
    opts: DeserializeOpts,
): Pick<CanvasImage, 'x' | 'y' | 'width' | 'height'> {
    if (
        d.relX != null && d.relY != null &&
        d.relW != null && d.relH != null
    ) {
        return {
            x: zone.left + d.relX * zone.width,
            y: zone.top + d.relY * zone.height,
            width: d.relW * zone.width,
            height: d.relH * zone.height,
        };
    }

    const x = d.x ?? 0;
    const y = d.y ?? 0;
    const width = d.width ?? 0;
    const height = d.height ?? 0;

    const sfSave = opts.stageScaleFactor ?? inferSaveScaleFactor([d], opts.imgW, opts.imgH);
    const ratio = opts.sfLoad / sfSave;

    return {
        x: x * ratio,
        y: y * ratio,
        width: width * ratio,
        height: height * ratio,
    };
}

export function zoneFromTemplate(
    printArea: { x: number; y: number; width: number; height: number },
    sf: number,
): PrintZoneRect {
    return {
        left: printArea.x * sf,
        top: printArea.y * sf,
        width: printArea.width * sf,
        height: printArea.height * sf,
    };
}
