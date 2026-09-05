import { Link } from 'react-router-dom';
import { ArrowRight, Pencil } from 'lucide-react';
import type { DashboardDesign } from '@/hooks/useDashboardStats';
import { getPreviewDisplayUrl } from '@/lib/previews';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
    designs: DashboardDesign[];
    loading: boolean;
}

export function ContinueDesigning({ designs, loading }: Props) {
    const { t } = useLanguage();
    const d = t.dashboard;
    const c = t.common;

    if (!loading && designs.length === 0) return null;

    return (
        <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-slate-900">
                    <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
                      <Pencil className="w-6 h-6" />
                    </div>
                    {d.continueDesigning}
                </h2>
                <Link to="/my-products" className="text-sm text-primary hover:underline font-normal flex items-center gap-1.5 transition-colors">
                    {c.viewAll} <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-slate-100 rounded-3xl aspect-4/3 animate-pulse" />
                    ))
                    : designs.map(design => (
                        <Link
                            key={design.id}
                            to={`/studio/${design.base_product_id}?designId=${design.id}`}
                            state={{ studioSource: 'dashboard' }}
                            className="group bg-white border border-slate-100/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col ring-1 ring-slate-900/5"
                        >
                            <div className="aspect-video sm:aspect-square bg-slate-50/50 relative flex items-center justify-center p-8 overflow-hidden">
                                {getPreviewDisplayUrl(design.preview_image_url) ? (
                                    <img
                                        src={getPreviewDisplayUrl(design.preview_image_url)}
                                        alt={design.design_name}
                                        className="h-full w-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                        <Pencil className="w-8 h-8 opacity-50" />
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex items-center justify-between bg-white border-t border-slate-50">
                                <p className="font-medium text-slate-800 truncate text-base">{design.design_name}</p>
                                <span className="flex items-center gap-1.5 text-primary text-sm font-medium shrink-0 ml-3 bg-teal-50 px-3 py-1.5 rounded-full group-hover:bg-[#07636D] group-hover:text-white transition-colors duration-300">
                                    <Pencil className="w-3.5 h-3.5" /> {d.editContinue}
                                </span>
                            </div>
                        </Link>
                    ))
                }
            </div>
        </section>
    );
}
