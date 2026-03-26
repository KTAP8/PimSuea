import { useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import type { CanvasImage } from '../../types/canvas';

interface PrintZone {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface Props {
    stageRef: React.RefObject<Konva.Stage | null>;
    bgNodeRef: React.RefObject<Konva.Image | null>;
    printZoneNodeRef: React.RefObject<Konva.Rect | null>;
    transformerRef: React.RefObject<Konva.Transformer | null>;
    bgImage: HTMLImageElement | null;
    stageSize: { width: number; height: number };
    printZone: PrintZone | null;
    canvasImages: CanvasImage[];
    selectedId: string | null;
    isExporting: boolean;
    pxPerInch: number | null;
    onSelect: (id: string | null) => void;
    onDragEnd: (id: string, x: number, y: number) => void;
    onTransform: (scaledW: number, scaledH: number) => void;
    onTransformEnd: (id: string, x: number, y: number, scaledW: number, scaledH: number, rotation: number) => void;
}

const SNAP_THRESHOLD = 8;
const ROTATION_SNAPS = [0, 45, 90, 135, 180, 225, 270, 315];

function computeSnap(
    node: Konva.Node,
    pz: PrintZone,
    sw: number,
    sh: number,
): { snapX: number | null; snapY: number | null; lines: number[][] } {
    const w = node.width() * node.scaleX();
    const h = node.height() * node.scaleY();
    const nx = node.x();
    const ny = node.y();

    const candidatesX = [
        { nodePt: nx,         zonePt: pz.left },
        { nodePt: nx + w / 2, zonePt: pz.left + pz.width / 2 },
        { nodePt: nx + w,     zonePt: pz.left + pz.width },
    ];
    const candidatesY = [
        { nodePt: ny,         zonePt: pz.top },
        { nodePt: ny + h / 2, zonePt: pz.top + pz.height / 2 },
        { nodePt: ny + h,     zonePt: pz.top + pz.height },
    ];

    let bestX: { nodePt: number; zonePt: number; diff: number } | null = null;
    for (const c of candidatesX) {
        const diff = Math.abs(c.nodePt - c.zonePt);
        if (diff < SNAP_THRESHOLD && (!bestX || diff < bestX.diff)) bestX = { ...c, diff };
    }
    let bestY: { nodePt: number; zonePt: number; diff: number } | null = null;
    for (const c of candidatesY) {
        const diff = Math.abs(c.nodePt - c.zonePt);
        if (diff < SNAP_THRESHOLD && (!bestY || diff < bestY.diff)) bestY = { ...c, diff };
    }

    const lines: number[][] = [];
    let snapX: number | null = null;
    let snapY: number | null = null;

    if (bestX) {
        snapX = nx + (bestX.zonePt - bestX.nodePt);
        lines.push([bestX.zonePt, 0, bestX.zonePt, sh]); // vertical guide
    }
    if (bestY) {
        snapY = ny + (bestY.zonePt - bestY.nodePt);
        lines.push([0, bestY.zonePt, sw, bestY.zonePt]); // horizontal guide
    }

    return { snapX, snapY, lines };
}

export function CanvasStage({
    stageRef, bgNodeRef, printZoneNodeRef, transformerRef,
    bgImage, stageSize, printZone, canvasImages, isExporting, pxPerInch,
    onSelect, onDragEnd, onTransform, onTransformEnd,
}: Props) {
    // Guide lines layer managed imperatively — bypasses React reconciler for perf
    const guidesLayerRef = useRef<Konva.Layer | null>(null);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const layer = new Konva.Layer({ listening: false });
        stage.add(layer);
        guidesLayerRef.current = layer;
        return () => {
            layer.destroy();
            guidesLayerRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showGuides = (lines: number[][]) => {
        const layer = guidesLayerRef.current;
        if (!layer) return;
        layer.destroyChildren();
        for (const points of lines) {
            layer.add(new Konva.Line({ points, stroke: '#0ea5e9', strokeWidth: 1, listening: false }));
        }
        layer.batchDraw();
    };

    const hideGuides = () => {
        const layer = guidesLayerRef.current;
        if (!layer) return;
        layer.destroyChildren();
        layer.batchDraw();
    };

    const handleDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (e.target === e.target.getStage() || e.target.name() === 'bg') onSelect(null);
    };

    return (
        <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleDeselect}
            onTouchStart={handleDeselect}>
            <Layer>
                {bgImage && (
                    <KonvaImage
                        ref={bgNodeRef}
                        name="bg"
                        image={bgImage}
                        width={stageSize.width}
                        height={stageSize.height}
                        visible={!isExporting}
                    />
                )}

                {canvasImages.map(ci => (
                    <KonvaImage
                        key={ci.id}
                        id={ci.id}
                        image={ci.image}
                        x={ci.x} y={ci.y}
                        width={ci.width} height={ci.height}
                        rotation={ci.rotation ?? 0}
                        draggable
                        onClick={() => onSelect(ci.id)}
                        onTap={() => onSelect(ci.id)}
                        onDragMove={e => {
                            if (!printZone) return;
                            const node = e.target;
                            const w = node.width() * node.scaleX();
                            const h = node.height() * node.scaleY();

                            // Snap to print zone edges/center + show guides
                            const snap = computeSnap(node, printZone, stageSize.width, stageSize.height);
                            showGuides(snap.lines);
                            if (snap.snapX !== null) node.x(snap.snapX);
                            if (snap.snapY !== null) node.y(snap.snapY);

                            // Clamp to print zone
                            const pzR = printZone.left + printZone.width;
                            const pzB = printZone.top + printZone.height;
                            let x = node.x(), y = node.y();
                            if (x < printZone.left) x = printZone.left;
                            else if (x + w > pzR) x = pzR - w;
                            if (y < printZone.top) y = printZone.top;
                            else if (y + h > pzB) y = pzB - h;
                            node.x(x); node.y(y);
                        }}
                        onDragEnd={e => {
                            hideGuides();
                            const node = e.target;
                            onDragEnd(ci.id, node.x(), node.y());
                        }}
                        onTransform={e => {
                            if (!pxPerInch) return;
                            const node = e.target;
                            onTransform(node.width() * node.scaleX(), node.height() * node.scaleY());
                        }}
                        onTransformEnd={e => {
                            const node = e.target;
                            const scaleX = node.scaleX();
                            const scaleY = node.scaleY();
                            node.scaleX(1);
                            node.scaleY(1);
                            onTransformEnd(ci.id, node.x(), node.y(), node.width() * scaleX, node.height() * scaleY, node.rotation());
                        }}
                    />
                ))}

                <Transformer
                    ref={transformerRef}
                    rotateEnabled={true}
                    keepRatio={true}
                    rotationSnaps={ROTATION_SNAPS}
                    rotationSnapTolerance={10}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) return oldBox;
                        if (!printZone) return newBox;
                        const pzR = printZone.left + printZone.width;
                        const pzB = printZone.top + printZone.height;
                        if (newBox.x < printZone.left || newBox.y < printZone.top ||
                            newBox.x + newBox.width > pzR || newBox.y + newBox.height > pzB) return oldBox;
                        return newBox;
                    }}
                />

                {printZone && (
                    <Rect
                        ref={printZoneNodeRef}
                        x={printZone.left} y={printZone.top}
                        width={printZone.width} height={printZone.height}
                        stroke="red" strokeWidth={1}
                        visible={!isExporting}
                        dash={[4, 4]}
                        listening={false}
                    />
                )}
            </Layer>
        </Stage>
    );
}
