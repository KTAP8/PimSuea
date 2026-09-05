import { Download, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface MockupResult {
    side: string;
    url: string;
}

interface Props {
    results: MockupResult[];
    onClose: () => void;
}

export function MockupModal({ results, onClose }: Props) {
    const { t } = useLanguage();
    const s = t.studio;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">{s.mockupPreviewTitle}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{s.mockupTitle}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex gap-5 flex-wrap justify-center">
                    {results.map(({ side, url }) => (
                        <div key={side} className="flex flex-col items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 w-64">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{side}</span>
                            <div className="relative overflow-hidden rounded-xl bg-white w-full aspect-4/5 border border-slate-100">
                                <img src={url} alt={`mockup-${side}`} className="w-full h-full object-cover" />
                            </div>
                            <a href={url} download={`mockup-${side}.png`} className="w-full">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                                    <Download className="w-3.5 h-3.5" />
                                    {s.download}
                                </button>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
