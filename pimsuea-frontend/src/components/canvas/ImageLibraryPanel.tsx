import { X, Upload, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { r2ProxyUrl } from '../../services/api';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
    userUploads: { name: string; url: string }[];
    loadingUploads: boolean;
    uploadsError?: string | null;
    isUploading: boolean;
    onClose: () => void;
    onAddImage: (url: string) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteRequest: (name: string) => void;
}

export function ImageLibraryPanel({ userUploads, loadingUploads, uploadsError, isUploading, onClose, onAddImage, onUpload, onDeleteRequest }: Props) {
    const { t } = useLanguage();
    const s = t.studio;

    return (
        <div className="fixed md:absolute bottom-toolbar-offset md:bottom-4 left-0 right-0 md:left-24 top-auto md:top-4 max-h-[50dvh] md:max-h-none md:h-auto md:w-80 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.12)] md:shadow-2xl rounded-t-3xl md:rounded-2xl border flex flex-col z-40 overflow-hidden">
            <div className="p-4 md:p-5 border-b flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-lg">{s.imageLibrary}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 border-b space-y-2">
                <label className={`w-full h-11 text-white rounded-xl flex items-center justify-center cursor-pointer gap-2 transition-all shadow-sm ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}>
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{isUploading ? s.uploading : s.uploadNew}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={onUpload} disabled={isUploading} />
                </label>
                <p className="text-xs text-gray-400 text-center">{s.uploadHint}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 grid grid-cols-2 gap-3">
                    {loadingUploads ? (
                        <div className="col-span-2 flex justify-center py-10">
                            <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
                        </div>
                    ) : uploadsError ? (
                        <div className="col-span-2 flex flex-col items-center justify-center text-center text-red-500 py-10 gap-2 px-4">
                            <span className="text-sm">{uploadsError}</span>
                        </div>
                    ) : userUploads.length === 0 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center text-center text-gray-400 py-10 gap-2">
                            <ImageIcon className="w-10 h-10 opacity-20" />
                            <span className="text-sm">{s.noImages}</span>
                        </div>
                    ) : (
                        userUploads.map((file, i) => (
                            <div key={i}
                                className="relative aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-black hover:ring-1 hover:ring-black hover:shadow-md transition-all group"
                                onClick={() => onAddImage(file.url)}>
                                <img src={r2ProxyUrl(file.url)} alt={file.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200" />
                                <button
                                    className="absolute top-1.5 right-1.5 w-9 h-9 min-h-11 min-w-11 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                                    onClick={e => { e.stopPropagation(); onDeleteRequest(file.name); }}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
