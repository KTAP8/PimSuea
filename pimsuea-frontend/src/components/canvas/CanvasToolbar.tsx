import { Redo2, Trash2, Undo2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { SizeEditor } from './SizeEditor';
import { PrintSizePresets } from './PrintSizePresets';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  displaySizeIn: { w: number; h: number } | null;
  printableIn: { w: number; h: number };
  onApplySize: (w: number, h: number) => void;
  onApplyPreset: (w: number, h: number) => void;
  hasSelection: boolean;
  onRemove: () => void;
};

/** Floating controls over the canvas: undo/redo (left), size + presets + layer actions (centre). */
export function CanvasToolbar(p: Props) {
  const { t } = useLanguage();
  const s = t.studio;
  const chip = 'pointer-events-auto bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm';
  return (
    <>
      <div className="absolute top-3 md:top-6 left-3 md:left-4 z-10 pointer-events-none">
        <div className={`${chip} flex items-center overflow-hidden`}>
          <button type="button" title={s.undoShortcut} aria-label={s.undo} disabled={!p.canUndo} onClick={p.onUndo}
            className="min-h-11 md:min-h-0 px-3 py-2.5 md:py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40 border-r border-gray-200">
            <Undo2 className="w-4 h-4" />
          </button>
          <button type="button" title={s.redoShortcut} aria-label={s.redo} disabled={!p.canRedo} onClick={p.onRedo}
            className="min-h-11 md:min-h-0 px-3 py-2.5 md:py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute top-3 md:top-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center items-center gap-2 z-10 pointer-events-none px-2 max-w-[calc(100%-7rem)] md:max-w-[calc(100%-2rem)]">
        <div className="hidden md:flex items-center gap-2">
          <SizeEditor displaySizeIn={p.displaySizeIn} onApply={p.onApplySize} />
          <PrintSizePresets sizeIn={p.displaySizeIn} printable={p.printableIn} onApply={p.onApplyPreset} />
        </div>
        {p.hasSelection && (
          <button type="button" onClick={p.onRemove} title={`${s.remove} (Del)`}
            className={`${chip} border-red-100 px-3 min-h-11 md:min-h-9 text-red-600 text-xs font-semibold hover:bg-red-50 flex items-center gap-1.5`}>
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /><span className="hidden sm:inline">{s.remove}</span>
          </button>
        )}
      </div>
    </>
  );
}
