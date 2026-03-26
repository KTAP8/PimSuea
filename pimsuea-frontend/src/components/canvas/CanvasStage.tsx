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
    onTransformEnd: (id: string, x: number, y: number, scaledW: number, scaledH: number) => void;
}

export function CanvasStage({
    stageRef, bgNodeRef, printZoneNodeRef, transformerRef,
    bgImage, stageSize, printZone, canvasImages, isExporting, pxPerInch,
    onSelect, onDragEnd, onTransform, onTransformEnd,
}: Props) {
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
                        draggable
                        onClick={() => onSelect(ci.id)}
                        onTap={() => onSelect(ci.id)}
                        onDragMove={e => {
                            if (!printZone) return;
                            const node = e.target;
                            const w = node.width() * node.scaleX();
                            const h = node.height() * node.scaleY();
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
                            onTransformEnd(ci.id, node.x(), node.y(), node.width() * scaleX, node.height() * scaleY);
                        }}
                    />
                ))}

                <Transformer
                    ref={transformerRef}
                    rotateEnabled={false}
                    keepRatio={true}
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
