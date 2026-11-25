import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/** Pointer + keyboard state for a before/after divider. `position` is 0–100 (% from the left). */
export function useBeforeAfterSlider(initial = 50) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [position, setPosition] = useState(initial);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) updateFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? 20 : 5;
    if (e.key === 'ArrowLeft') setPosition((p) => clamp(p - step));
    else if (e.key === 'ArrowRight') setPosition((p) => clamp(p + step));
    else if (e.key === 'Home') setPosition(0);
    else if (e.key === 'End') setPosition(100);
    else return;
    e.preventDefault();
  };

  return {
    containerRef,
    position,
    containerProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    onKeyDown,
  };
}
