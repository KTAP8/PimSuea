import { useLanguage } from '@/i18n/LanguageContext';

type Props = { onCancel: () => void; onConfirm: () => void };

export function DeleteImageModal({ onCancel, onConfirm }: Props) {
  const { t } = useLanguage();
  const s = t.studio;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl" role="dialog" aria-modal="true" aria-labelledby="del-img-title">
        <h3 id="del-img-title" className="font-bold text-base mb-2">{s.deleteImageTitle}</h3>
        <p className="text-sm text-gray-600 mb-5">{s.deleteImageDesc}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 min-h-11 text-sm rounded-lg border hover:bg-gray-50">{t.common.cancel}</button>
          <button onClick={onConfirm} className="px-4 min-h-11 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">{t.common.delete}</button>
        </div>
      </div>
    </div>
  );
}
