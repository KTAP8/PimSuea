import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
    /** Leave; the local draft stays and is restored next time. */
    onKeep: () => void;
    /** Leave and delete the local draft. */
    onDiscard: () => void;
    onCancel: () => void;
}

export function LeaveConfirmModal({ onKeep, onDiscard, onCancel }: Props) {
    const { t } = useLanguage();
    const s = t.studioTools;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="leave-title">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <h3 id="leave-title" className="font-bold text-base mb-2">{s.leaveTitle}</h3>
                <p className="text-sm text-gray-600 mb-5">{s.leaveBody}</p>
                <div className="flex flex-col gap-2">
                    <button onClick={onKeep} className="min-h-11 px-4 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90">
                        {s.leaveKeep}
                    </button>
                    <button onClick={onCancel} className="min-h-11 px-4 text-sm font-semibold rounded-xl border hover:bg-gray-50">
                        {s.leaveStay}
                    </button>
                    <button onClick={onDiscard} className="min-h-11 px-4 text-sm rounded-xl text-red-600 hover:bg-red-50">
                        {s.leaveDiscard}
                    </button>
                </div>
            </div>
        </div>
    );
}
