import { RotateCcw } from 'lucide-react';

interface Props {
    scale: number;
    isPanMode: boolean;
    onReset: () => void;
}

export function CanvasZoomHint({ scale, isPanMode, onReset }: Props) {
    const pct = Math.round(scale * 100);

    return (
        <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-2 pointer-events-none select-none z-10">
            {/* Shortcuts hint — fades in when not at 100% or in pan mode */}
            <div className={`transition-opacity duration-300 ${scale !== 1 || isPanMode ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-[10px] text-gray-400 font-medium bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-100 whitespace-nowrap">
                    {isPanMode ? '✋ กำลังเลื่อน' : '⌘0 รีเซ็ต'}
                </span>
            </div>

            {/* Zoom % badge + reset button */}
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm pointer-events-auto">
                <span className={`text-xs font-bold tabular-nums transition-colors ${isPanMode ? 'text-blue-500' : 'text-gray-700'}`}>
                    {pct}%
                </span>
                {scale !== 1 && (
                    <button
                        onClick={onReset}
                        className="ml-1 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Reset zoom (⌘0)">
                        <RotateCcw className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}

// Static hint shown at the bottom-left — always visible on desktop, hidden on mobile
export function CanvasShortcutHint() {
    return (
        <div className="absolute bottom-6 left-6 hidden md:block pointer-events-none select-none z-10">
            <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl px-3 py-2.5 shadow-sm">
                <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 w-max">
                    <kbd className="font-sans bg-gray-100/80 px-1.5 py-0.5 rounded border border-gray-200/80 text-gray-600 shadow-[0_1px_1px_rgba(0,0,0,0.02)]">Space</kbd> + ลาก = เลื่อน
                </span>
                <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 w-max">
                    <kbd className="font-sans bg-gray-100/80 px-1.5 py-0.5 rounded border border-gray-200/80 text-gray-600 shadow-[0_1px_1px_rgba(0,0,0,0.02)]">⌘ / Ctrl</kbd> + เลื่อน = ซูม
                </span>
                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 w-max mt-0.5">
                    ✌️ 2 นิ้ว = เลื่อน/ซูม
                </span>
            </div>
        </div>
    );
}
