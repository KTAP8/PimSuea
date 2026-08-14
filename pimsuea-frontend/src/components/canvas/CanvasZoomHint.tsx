import { RotateCcw } from 'lucide-react';

interface Props {
    scale: number;
    isPanMode: boolean;
    isDefaultView: boolean;
    onReset: () => void;
}

export function CanvasZoomHint({ scale, isPanMode, isDefaultView, onReset }: Props) {
    const pct = Math.round(scale * 100);
    const showResetHint = !isDefaultView || isPanMode;

    return (
        <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] md:top-auto md:bottom-6 md:right-6 flex flex-col items-end gap-2 pointer-events-none select-none z-10">
            {/* Reset view — appears when zoomed or panned away from default */}
            {!isDefaultView && (
                <button
                    type="button"
                    onClick={onReset}
                    className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all min-h-11 md:min-h-0"
                    title="กลับไปมุมมองเริ่มต้น (⌘0)">
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Reset view</span>
                </button>
            )}

            <div className="flex items-center gap-2">
                {/* Shortcuts hint — desktop only */}
                <div className={`hidden md:block transition-opacity duration-300 ${showResetHint ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-[10px] text-gray-400 font-medium bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-100 whitespace-nowrap">
                        {isPanMode ? '✋ กำลังเลื่อน' : '⌘0 รีเซ็ต'}
                    </span>
                </div>

                {/* Zoom % badge */}
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm pointer-events-auto">
                    <span className={`text-xs font-bold tabular-nums transition-colors ${isPanMode ? 'text-blue-500' : 'text-gray-700'}`}>
                        {pct}%
                    </span>
                </div>
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
                <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 w-max">
                    <kbd className="font-sans bg-gray-100/80 px-1.5 py-0.5 rounded border border-gray-200/80 text-gray-600 shadow-[0_1px_1px_rgba(0,0,0,0.02)]">⌘0</kbd> = มุมมองเริ่มต้น
                </span>
                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 w-max mt-0.5">
                    ✌️ 2 นิ้ว = เลื่อน/ซูม
                </span>
            </div>
        </div>
    );
}
