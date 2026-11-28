import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

type Props = { dpi: number; isUploading: boolean; onCancel: () => void; onProceed: () => void };

export function LowResModal({ dpi, isUploading, onCancel, onProceed }: Props) {
  const { t } = useLanguage();
  const s = t.studio;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" role="dialog" aria-modal="true" aria-labelledby="low-res-title">
        <h3 id="low-res-title" className="font-bold text-base text-gray-900 mb-3">{s.lowResTitle}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {s.lowResDesc} <span className="font-semibold text-gray-900">{dpi} DPI</span>{s.lowResHint}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" disabled={isUploading} onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-11">
            {s.lowResDontAdd}
          </button>
          <button type="button" disabled={isUploading} onClick={onProceed}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 min-h-11">
            {isUploading ? (<><Loader2 className="w-4 h-4 animate-spin" />{s.uploading}</>) : s.lowResAddToShirt}
          </button>
        </div>
      </div>
    </div>
  );
}
