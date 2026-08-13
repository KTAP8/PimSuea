import { X, Plus, Check } from 'lucide-react';
import type { ProductTemplate, Color } from '../../types/api';
import { cn } from '@/lib/utils';

interface Props {
    currentSides: ProductTemplate[];
    currentTemplate: ProductTemplate | null;
    selectedColorId: string | null;
    activeColorIds: Set<string>;
    showColorPicker: boolean;
    uniqueColors: Color[];
    colorPickerRef: React.RefObject<HTMLDivElement | null>;
    onSideChange: (template: ProductTemplate) => void;
    onColorSelect: (colorId: string) => void;
    onToggleColorPicker: () => void;
    onColorAdd: (colorId: string) => void;
    onColorRemove: (colorId: string) => void;
    /** floating = overlay on canvas (desktop); bar = fixed strip below canvas (mobile) */
    layout?: 'floating' | 'bar';
}

export function BottomContextPanel({
    currentSides, currentTemplate, selectedColorId, activeColorIds, showColorPicker, uniqueColors,
    colorPickerRef, onSideChange, onColorSelect, onToggleColorPicker, onColorAdd, onColorRemove,
    layout = 'floating',
}: Props) {
    const isBar = layout === 'bar';

    const sideControl = (
        <div className={cn(
            'flex bg-gray-100/80 rounded-xl p-1 shrink-0',
            isBar ? 'flex-1 max-w-[9rem]' : '',
        )}>
            {currentSides.map(t => (
                <button
                    key={t.id}
                    onClick={() => onSideChange(t)}
                    className={cn(
                        'flex-1 rounded-lg text-sm font-semibold transition-all min-h-10',
                        isBar ? 'px-2 py-2' : 'px-5 py-1.5',
                        t.id === currentTemplate?.id
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50',
                    )}
                >
                    {t.side}
                </button>
            ))}
        </div>
    );

    const colorControl = (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {uniqueColors.filter(c => activeColorIds.has(c.id)).map(color => {
                const isViewing = color.id === selectedColorId;
                return (
                    <div key={color.id} className="relative group">
                        <button
                            title={color.name}
                            onClick={() => onColorSelect(color.id)}
                            className={cn(
                                'rounded-full border-2 transition-all shadow-sm',
                                isBar ? 'w-9 h-9' : 'w-8 h-8',
                                isViewing ? 'border-primary scale-110 ring-4 ring-primary/15' : 'border-black/10 hover:scale-105',
                            )}
                            style={{ backgroundColor: color.hex_code ?? '#ccc' }}
                        />
                        {activeColorIds.size > 1 && (
                            <button
                                title="Remove color"
                                onClick={e => { e.stopPropagation(); onColorRemove(color.id); }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 rounded-full flex md:hidden md:group-hover:flex items-center justify-center z-10 hover:bg-red-500 transition-colors"
                            >
                                <X className="w-2.5 h-2.5 text-white" />
                            </button>
                        )}
                    </div>
                );
            })}

            <div className="relative" ref={colorPickerRef}>
                <button
                    title="Add color"
                    onClick={onToggleColorPicker}
                    className={cn(
                        'rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all',
                        isBar ? 'w-9 h-9' : 'w-8 h-8 hover:scale-105',
                    )}
                >
                    <Plus className="w-4 h-4" />
                </button>

                {showColorPicker && (
                    <div className={cn(
                        'absolute bg-white rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[160px] z-50 max-h-48 overflow-y-auto',
                        isBar ? 'bottom-full mb-2 right-0' : 'bottom-full mb-3 left-1/2 -translate-x-1/2',
                    )}>
                        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase px-2 py-1.5">สีที่มี</p>
                        {uniqueColors.map(color => {
                            const isActive = activeColorIds.has(color.id);
                            return (
                                <button
                                    key={color.id}
                                    onClick={() => {
                                        if (isActive && activeColorIds.size > 1) onColorRemove(color.id);
                                        else if (!isActive) onColorAdd(color.id);
                                    }}
                                    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors min-h-11"
                                >
                                    <div className="w-6 h-6 rounded-full border border-black/10 shrink-0 shadow-sm" style={{ backgroundColor: color.hex_code ?? '#ccc' }} />
                                    <span className="flex-1 text-sm text-gray-700 text-left truncate">{color.name}</span>
                                    {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    if (isBar) {
        return (
            <div className="shrink-0 border-t border-gray-100 bg-white py-2.5 px-safe md:hidden z-20">
                <div className="flex items-center gap-3">
                    {sideControl}
                    <div className="w-px h-8 bg-gray-200 shrink-0" />
                    {colorControl}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full px-8 py-3.5 hidden md:flex items-center gap-8 border border-gray-100 z-10 transition-all">

            <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Side</span>
                {sideControl}
            </div>

            <div className="w-px h-8 bg-gray-200" />

            <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Color</span>
                {colorControl}
            </div>
        </div>
    );
}
