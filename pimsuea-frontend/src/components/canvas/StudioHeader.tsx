import { ArrowLeft, ImageIcon, Loader2, Save, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';

type Props = {
  designName: string;
  onNameChange: (v: string) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  isDirty: boolean;
  onBack: () => void;
  onMockup: () => void;
  mockupDisabled: boolean;
  generatingMockup: boolean;
  onOrder: () => void;
  orderDisabled: boolean;
  onSave: () => void;
  isSaving: boolean;
  saveStatus: 'idle' | 'saved' | 'error';
};

/** Studio top bar. On mobile every action keeps a short text label (no icon-only buttons). */
export function StudioHeader({ nameInputRef, ...p }: Props) {
  const { t } = useLanguage();
  const s = t.studio;
  const st = t.studioTools;
  const action = 'flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 min-w-12 h-12 md:h-auto px-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shrink-0';

  return (
    <div className="flex items-center justify-between pt-safe-bar pb-2 md:pb-3 px-safe md:px-6 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-20 shrink-0 gap-1 sm:gap-2">
      <div className="flex items-center gap-1 md:gap-3 flex-none md:w-1/3">
        <button onClick={p.onBack} aria-label={t.common.back}
          className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-gray-800 tracking-tight text-sm hidden md:inline">{s.designCanvas}</span>
      </div>

      <div className="flex-1 flex items-center justify-center md:w-1/3 min-w-0 px-1">
        <div className="relative flex flex-col items-center w-full max-w-44 sm:max-w-xs md:max-w-none">
          <input
            value={p.designName}
            onChange={(e) => p.onNameChange(e.target.value)}
            ref={nameInputRef}
            aria-label={s.untitledDesign}
            placeholder={s.untitledDesign}
            className="bg-transparent hover:bg-gray-100/60 focus:bg-white border border-transparent focus:border-gray-200 focus:ring-4 focus:ring-gray-100/50 text-center rounded-xl px-2 md:px-4 py-2 md:py-1.5 text-xs md:text-sm font-bold text-gray-800 w-full md:w-64 focus:outline-none truncate min-h-11 md:min-h-0"
          />
          {p.isDirty && (
            <span className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200/60 text-[10.5px] font-bold whitespace-nowrap pointer-events-none">
              {s.unsaved}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 md:gap-2.5 flex-none md:w-1/3">
        <LanguageSwitcher compact className="hidden sm:flex shrink-0" />
        <button onClick={p.onMockup} disabled={p.mockupDisabled || p.generatingMockup} title={s.mockupPreview}
          className={cn(action, 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}>
          {p.generatingMockup ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          <span className="md:hidden">{st.mockupShort}</span>
          <span className="hidden md:inline">{p.generatingMockup ? s.generatingMockup : s.mockup}</span>
        </button>
        <button onClick={p.onOrder} disabled={p.orderDisabled} title={s.order}
          className={cn(action, 'bg-action text-white shadow-sm shadow-action/20 hover:bg-action/90')}>
          <ShoppingCart className="w-4 h-4" />
          <span>{s.order}</span>
        </button>
        <button onClick={p.onSave} disabled={p.isSaving || p.orderDisabled} title={t.common.save}
          className={cn(action, p.saveStatus === 'saved' ? 'bg-green-600 text-white' : p.saveStatus === 'error' ? 'bg-destructive text-white' : 'bg-primary text-white hover:bg-primary/90')}>
          {p.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span className="md:hidden">{p.saveStatus === 'saved' ? st.saved : st.saveShort}</span>
          <span className="hidden md:inline">{p.isSaving ? s.saving : p.saveStatus === 'saved' ? s.saved : t.common.save}</span>
        </button>
      </div>
    </div>
  );
}
