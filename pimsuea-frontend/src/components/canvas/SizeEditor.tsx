import { useState, useEffect, useRef } from 'react';

interface Props {
    displaySizeIn: { w: number; h: number } | null;
    onApply: (w: number, h: number) => void;
}

export function SizeEditor({ displaySizeIn, onApply }: Props) {
    const [editW, setEditW] = useState('');
    const [editH, setEditH] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const aspectRef = useRef(1);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const displayRef = useRef(displaySizeIn);

    useEffect(() => { displayRef.current = displaySizeIn; }, [displaySizeIn]);

    // Sync inputs from outside when not actively editing
    useEffect(() => {
        if (!isFocused && displaySizeIn) {
            setEditW(displaySizeIn.w.toFixed(2));
            setEditH(displaySizeIn.h.toFixed(2));
        }
    }, [displaySizeIn, isFocused]);

    if (!displaySizeIn) return null;

    const handleFocus = () => {
        if (blurTimer.current) clearTimeout(blurTimer.current);
        if (!isFocused) {
            setIsFocused(true);
            aspectRef.current = displaySizeIn.w / displaySizeIn.h;
        }
    };

    const handleBlur = () => {
        blurTimer.current = setTimeout(() => {
            setIsFocused(false);
            const w = parseFloat(editW);
            const h = parseFloat(editH);
            if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                onApply(w, h);
            } else {
                const cur = displayRef.current;
                if (cur) { setEditW(cur.w.toFixed(2)); setEditH(cur.h.toFixed(2)); }
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
            const cur = displayRef.current;
            if (cur) { setEditW(cur.w.toFixed(2)); setEditH(cur.h.toFixed(2)); }
            e.currentTarget.blur();
        }
    };

    const handleWChange = (val: string) => {
        setEditW(val);
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) setEditH((n / aspectRef.current).toFixed(2));
    };

    const handleHChange = (val: string) => {
        setEditH(val);
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) setEditW((n * aspectRef.current).toFixed(2));
    };

    return (
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-lg shadow-sm">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider select-none">W</span>
            <input
                className="w-12 bg-transparent border-b border-transparent focus:border-gray-400 outline-none text-center font-mono text-xs text-gray-700"
                value={editW}
                onChange={e => handleWChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
            <span className="font-mono text-xs text-gray-400 select-none">"</span>
            <span className="text-gray-300 select-none">×</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider select-none">H</span>
            <input
                className="w-12 bg-transparent border-b border-transparent focus:border-gray-400 outline-none text-center font-mono text-xs text-gray-700"
                value={editH}
                onChange={e => handleHChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
            <span className="font-mono text-xs text-gray-400 select-none">"</span>
        </div>
    );
}
