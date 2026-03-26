import { X, ChevronUp, ChevronDown, Trash2, Layers } from 'lucide-react';
import { r2ProxyUrl } from '../../services/api';
import type { CanvasImage } from '../../types/canvas';

interface Props {
    canvasImages: CanvasImage[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onMove: (id: string, dir: 'forward' | 'backward') => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export function LayerPanel({ canvasImages, selectedId, onSelect, onMove, onDelete, onClose }: Props) {
    return (
        <div className="w-64 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl border border-gray-100 flex flex-col z-40 absolute right-6 top-6 bottom-32 overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50/50">
                <h3 className="font-semibold text-base flex items-center gap-2 text-gray-800">
                    <Layers className="w-4 h-4" /> Layers
                </h3>
                <button onClick={onClose}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                {canvasImages.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No layers yet</p>
                ) : (
                    [...canvasImages].reverse().map((ci, displayIdx) => {
                        const realIdx = canvasImages.length - 1 - displayIdx;
                        const isSelected = ci.id === selectedId;
                        return (
                            <div key={ci.id}
                                onClick={() => onSelect(ci.id)}
                                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer group border transition-colors ${isSelected ? 'bg-primary/5 border-primary/20 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded bg-gray-100 shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                                    <img
                                        src={ci.src.startsWith('blob:') ? ci.src : r2ProxyUrl(ci.src)}
                                        className="w-full h-full object-contain"
                                        alt=""
                                    />
                                </div>
                                <span className="flex-1 text-xs text-gray-600 truncate min-w-0">
                                    Layer {canvasImages.length - displayIdx}
                                </span>
                                <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={e => { e.stopPropagation(); onMove(ci.id, 'forward'); }}
                                        disabled={realIdx >= canvasImages.length - 1}
                                        className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                                        title="Bring Forward">
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); onMove(ci.id, 'backward'); }}
                                        disabled={realIdx <= 0}
                                        className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                                        title="Send Backward">
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); onDelete(ci.id); }}
                                    className="shrink-0 p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
