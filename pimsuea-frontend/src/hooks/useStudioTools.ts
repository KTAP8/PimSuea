import { useCallback, useEffect, useState } from 'react';
import type { useCanvasDesign } from '@/hooks/useCanvasDesign';

export type StudioPanel = 'library' | 'layers' | 'price';

type Design = ReturnType<typeof useCanvasDesign>;

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** Studio side panels, drag & drop upload, print-size presets and keyboard delete. Keeps DesignStudio.tsx wiring-only. */
export function useStudioTools(d: Design) {
  const [panel, setPanel] = useState<StudioPanel | null>(null);
  const [dragging, setDragging] = useState(false);

  const open = useCallback((next: StudioPanel | null) => {
    setPanel(next);
    d.setShowImageLibrary(next === 'library');
    d.setShowLayerPanel(next === 'layers');
  }, [d]);
  const toggle = useCallback((p: StudioPanel) => open(panel === p ? null : p), [open, panel]);

  // Delete / Backspace removes the selected layer (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && d.selectedId && !isTyping(e.target)) {
        e.preventDefault();
        d.removeCanvasLayer(d.selectedId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d]);

  /** Drop an image anywhere on the canvas area to upload it. */
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void d.handleFileChosen(file);
    },
  };

  const printableIn = {
    w: (d.currentTemplate?.print_area_config?.physical_w_cm ?? 30.48) / 2.54,
    h: (d.currentTemplate?.print_area_config?.physical_h_cm ?? 40.64) / 2.54,
  };
  const applyPreset = (w: number, h: number) => d.applySizeIn(w, h, { keepCenter: true });

  return { panel, open, toggle, dragging, dropHandlers, printableIn, applyPreset };
}
