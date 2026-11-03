import type { CanvasImage } from '../types/canvas';

export type SideLayers = Record<string, CanvasImage[]>;

export interface CanvasHistorySnapshot {
    sides: SideLayers;
    activeSide: string;
    selectedId: string | null;
}

export function cloneCanvasImage(ci: CanvasImage): CanvasImage {
    return {
        ...ci,
        rotation: ci.rotation ?? 0,
    };
}

export function cloneSideLayers(sideImages: SideLayers): SideLayers {
    const out: SideLayers = {};
    for (const [side, imgs] of Object.entries(sideImages)) {
        out[side] = imgs.map(cloneCanvasImage);
    }
    return out;
}

export function snapshotKey(snap: CanvasHistorySnapshot): string {
    const parts: string[] = [snap.activeSide, snap.selectedId ?? ''];
    for (const side of Object.keys(snap.sides).sort()) {
        for (const ci of snap.sides[side] ?? []) {
            parts.push(
                `${side}:${ci.id}:${ci.src}:${ci.x}:${ci.y}:${ci.width}:${ci.height}:${ci.rotation ?? 0}`,
            );
        }
    }
    return parts.join('|');
}
