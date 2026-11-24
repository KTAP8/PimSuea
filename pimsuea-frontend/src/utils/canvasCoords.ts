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

export type SideAabbCm = {
    w: number;
    h: number;
    x_cm: number;
    y_cm: number;
    px_x: number;
    px_y: number;
    px_w: number;
    px_h: number;
};

/** Print AABB from stored layers when that side is not hydrated on the canvas yet. */
export function sideAabbFromSerializedLayers(
    layers: SerializableImage[],
    physW_cm: number,
    physH_cm: number,
    imgZoneW: number,
    imgZoneH: number,
    legacyStageZone?: PrintZoneRect,
): SideAabbCm | null {
    if (!layers.length) return null;

    const allRel = layers.every(
        (l) =>
            l.relX != null &&
            l.relY != null &&
            l.relW != null &&
            l.relH != null,
    );

    if (allRel) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const l of layers) {
            minX = Math.min(minX, l.relX!);
            minY = Math.min(minY, l.relY!);
            maxX = Math.max(maxX, l.relX! + l.relW!);
            maxY = Math.max(maxY, l.relY! + l.relH!);
        }
        const cx = Math.max(0, minX);
        const cy = Math.max(0, minY);
        const cx2 = Math.min(1, maxX);
        const cy2 = Math.min(1, maxY);
        if (cx2 <= cx || cy2 <= cy) return null;
        const rw = cx2 - cx;
        const rh = cy2 - cy;
        return {
            w: rw * physW_cm,
            h: rh * physH_cm,
            x_cm: cx * physW_cm,
            y_cm: cy * physH_cm,
            px_x: Math.round(cx * imgZoneW),
            px_y: Math.round(cy * imgZoneH),
            px_w: Math.round(rw * imgZoneW),
            px_h: Math.round(rh * imgZoneH),
        };
    }

    if (!legacyStageZone) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const l of layers) {
        const x = l.x ?? 0;
        const y = l.y ?? 0;
        const w = l.width ?? 0;
        const h = l.height ?? 0;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
    }
    const pz = legacyStageZone;
    const cx = Math.max(minX, pz.left);
    const cy = Math.max(minY, pz.top);
    const cx2 = Math.min(maxX, pz.left + pz.width);
    const cy2 = Math.min(maxY, pz.top + pz.height);
    if (cx2 <= cx || cy2 <= cy) return null;
    const rx = cx - pz.left;
    const ry = cy - pz.top;
    const rw = cx2 - cx;
    const rh = cy2 - cy;
    const sfW = imgZoneW / pz.width;
    const sfH = imgZoneH / pz.height;
    return {
        w: (rw * physW_cm) / pz.width,
        h: (rh * physH_cm) / pz.height,
        x_cm: (rx * physW_cm) / pz.width,
        y_cm: (ry * physH_cm) / pz.height,
        px_x: Math.round(rx * sfW),
        px_y: Math.round(ry * sfH),
        px_w: Math.round(rw * sfW),
        px_h: Math.round(rh * sfH),
    };
}

export function printDimensionsFromSerializedLayers(
    layers: SerializableImage[],
    physW_cm: number,
    physH_cm: number,
    imgZoneW: number,
    imgZoneH: number,
    legacyStageZone?: PrintZoneRect,
): { w: number; h: number } | null {
    const aabb = sideAabbFromSerializedLayers(
        layers,
        physW_cm,
        physH_cm,
        imgZoneW,
        imgZoneH,
        legacyStageZone,
    );
    return aabb ? { w: aabb.w, h: aabb.h } : null;
}
