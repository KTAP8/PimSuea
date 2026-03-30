import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import type { CanvasImage } from '../../types/canvas';
import { CanvasZoomHint, CanvasShortcutHint } from './CanvasZoomHint';

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
const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_FACTOR = 1.15;

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
        lines.push([bestX.zonePt, 0, bestX.zonePt, sh]);
    }
    if (bestY) {
        snapY = ny + (bestY.zonePt - bestY.nodePt);
        lines.push([0, bestY.zonePt, sw, bestY.zonePt]);
    }

    return { snapX, snapY, lines };
}

export function CanvasStage({
    stageRef, bgNodeRef, printZoneNodeRef, transformerRef,
    bgImage, stageSize, printZone, canvasImages, isExporting, pxPerInch,
    onSelect, onDragEnd, onTransform, onTransformEnd,
}: Props) {
    // Guide lines layer — managed imperatively for perf
    const guidesLayerRef = useRef<Konva.Layer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Zoom / pan state
    const [stageScale, setStageScale] = useState(1);
    const stageScaleRef = useRef(1);
    const [isPanMode, setIsPanMode] = useState(false);
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ mouseX: 0, mouseY: 0, stageX: 0, stageY: 0 });

    // Guides layer setup
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const layer = new Konva.Layer({ listening: false });
        stage.add(layer);
        guidesLayerRef.current = layer;
        return () => { layer.destroy(); guidesLayerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Zoom helpers ──────────────────────────────────────────────────────────
    const applyZoom = (newScale: number, originX?: number, originY?: number) => {
        const stage = stageRef.current;
        if (!stage) return;
        const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        if (originX !== undefined && originY !== undefined) {
            const oldPos = stage.position();
            const pointerInStage = {
                x: (originX - oldPos.x) / stageScaleRef.current,
                y: (originY - oldPos.y) / stageScaleRef.current,
            };
            const newPos = {
                x: originX - pointerInStage.x * clamped,
                y: originY - pointerInStage.y * clamped,
            };
            stage.scale({ x: clamped, y: clamped });
            stage.position(newPos);
        } else {
            // Zoom around center
            const cx = stageSize.width / 2;
            const cy = stageSize.height / 2;
            const oldPos = stage.position();
            const pointerInStage = {
                x: (cx - oldPos.x) / stageScaleRef.current,
                y: (cy - oldPos.y) / stageScaleRef.current,
            };
            stage.scale({ x: clamped, y: clamped });
            stage.position({
                x: cx - pointerInStage.x * clamped,
                y: cy - pointerInStage.y * clamped,
            });
        }
        stageScaleRef.current = clamped;
        setStageScale(clamped);
        stage.batchDraw();
    };

    const resetZoom = () => {
        const stage = stageRef.current;
        if (!stage) return;
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stageScaleRef.current = 1;
        setStageScale(1);
        stage.batchDraw();
    };

    // ── Keyboard: spacebar (pan mode) + Cmd/Ctrl +/- (zoom) ──────────────────
    useEffect(() => {
        const isInputFocused = () => {
            const tag = (document.activeElement as HTMLElement)?.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA';
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !isInputFocused()) {
                e.preventDefault();
                setIsPanMode(true);
            }
            if ((e.metaKey || e.ctrlKey) && !isInputFocused()) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    applyZoom(stageScaleRef.current * ZOOM_FACTOR);
                } else if (e.key === '-') {
                    e.preventDefault();
                    applyZoom(stageScaleRef.current / ZOOM_FACTOR);
                } else if (e.key === '0') {
                    e.preventDefault();
                    resetZoom();
                }
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') { setIsPanMode(false); isPanningRef.current = false; }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stageSize]);

    // ── Touch: pinch-to-zoom + pan (2 fingers) ────────────────────────────────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let lastDist = 0;
        let lastCenter = { x: 0, y: 0 };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 2) return;
            e.preventDefault();
            const stage = stageRef.current;
            if (!stage) return;

            const [t1, t2] = [e.touches[0], e.touches[1]];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

            if (!lastDist) { lastDist = dist; lastCenter = center; return; }

            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, stageScaleRef.current * (dist / lastDist)));
            const rect = stage.container().getBoundingClientRect();
            const ox = center.x - rect.left;
            const oy = center.y - rect.top;
            const oldPos = stage.position();
            const px = (ox - oldPos.x) / stageScaleRef.current;
            const py = (oy - oldPos.y) / stageScaleRef.current;
            const dx = center.x - lastCenter.x;
            const dy = center.y - lastCenter.y;

            stage.scale({ x: newScale, y: newScale });
            stage.position({ x: ox - px * newScale + dx, y: oy - py * newScale + dy });
            stageScaleRef.current = newScale;
            setStageScale(newScale);
            stage.batchDraw();

            lastDist = dist;
            lastCenter = center;
        };

        const onTouchEnd = () => { lastDist = 0; };

        container.addEventListener('touchmove', onTouchMove, { passive: false });
        container.addEventListener('touchend', onTouchEnd);
        return () => {
            container.removeEventListener('touchmove', onTouchMove);
            container.removeEventListener('touchend', onTouchEnd);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Wheel: pinch/Ctrl+scroll → zoom, 2-finger scroll → pan ───────────────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const stage = stageRef.current;
            if (!stage) return;
            if (e.ctrlKey) {
                // Pinch gesture or Ctrl+scroll → zoom
                const pointer = stage.getPointerPosition();
                const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
                applyZoom(stageScaleRef.current * factor, pointer?.x, pointer?.y);
            } else {
                // 2-finger pan
                const newPos = { x: stage.x() - e.deltaX, y: stage.y() - e.deltaY };
                stage.position(newPos);
                stage.batchDraw();
            }
        };
        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Stage mouse events for spacebar-pan ──────────────────────────────────
    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (isPanMode) {
            isPanningRef.current = true;
            const stage = stageRef.current!;
            panStartRef.current = {
                mouseX: e.evt.clientX,
                mouseY: e.evt.clientY,
                stageX: stage.x(),
                stageY: stage.y(),
            };
            return;
        }
        // Normal deselect
        if (e.target === e.target.getStage() || e.target.name() === 'bg') onSelect(null);
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isPanningRef.current) return;
        const stage = stageRef.current!;
        const dx = e.evt.clientX - panStartRef.current.mouseX;
        const dy = e.evt.clientY - panStartRef.current.mouseY;
        stage.position({ x: panStartRef.current.stageX + dx, y: panStartRef.current.stageY + dy });
        stage.batchDraw();
    };

    const handleStageMouseUp = () => {
        isPanningRef.current = false;
    };

    // ── Guide line helpers ────────────────────────────────────────────────────
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

    const cursor = isPanningRef.current ? 'cursor-grabbing' : isPanMode ? 'cursor-grab' : 'cursor-default';

    return (
        <div ref={containerRef} className={`absolute inset-0 select-none ${cursor} flex items-center justify-center overflow-hidden`}>
            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onTouchStart={e => {
                    if (e.evt.touches.length === 1 && !isPanMode && (e.target === e.target.getStage() || e.target.name() === 'bg')) onSelect(null);
                }}>
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
                            draggable={!isPanMode}
                            onClick={() => { if (!isPanMode) onSelect(ci.id); }}
                            onTap={() => onSelect(ci.id)}
                            onDragMove={e => {
                                if (!printZone) return;
                                const node = e.target;
                                const w = node.width() * node.scaleX();
                                const h = node.height() * node.scaleY();
                                const snap = computeSnap(node, printZone, stageSize.width, stageSize.height);
                                showGuides(snap.lines);
                                if (snap.snapX !== null) node.x(snap.snapX);
                                if (snap.snapY !== null) node.y(snap.snapY);
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
                            const pzL = printZone.left;
                            const pzT = printZone.top;
                            const pzR = printZone.left + printZone.width;
                            const pzB = printZone.top + printZone.height;
                            // Clamp position to zone
                            const x = Math.max(pzL, Math.min(newBox.x, pzR - Math.abs(newBox.width)));
                            const y = Math.max(pzT, Math.min(newBox.y, pzB - Math.abs(newBox.height)));
                            // Clamp size so right/bottom edges stay inside zone
                            const width  = newBox.width  > 0 ? Math.min(newBox.width,  pzR - x) : Math.max(newBox.width,  -(x - pzL));
                            const height = newBox.height > 0 ? Math.min(newBox.height, pzB - y) : Math.max(newBox.height, -(y - pzT));
                            if (Math.abs(width) < 10 || Math.abs(height) < 10) return oldBox;
                            return { ...newBox, x, y, width, height };
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

            {/* Zoom % + reset */}
            <CanvasZoomHint scale={stageScale} isPanMode={isPanMode} onReset={resetZoom} />
            {/* Keyboard shortcut hint */}
            <CanvasShortcutHint />
        </div>
    );
}
