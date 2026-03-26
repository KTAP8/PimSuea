import { Link } from 'react-router-dom';
import { ArrowRight, Pencil } from 'lucide-react';
import type { DashboardDesign } from '@/hooks/useDashboardStats';

function getFirstPreview(raw: string | null | undefined): string {
    if (!raw) return '';
    try {
        const m = JSON.parse(raw);
        if (m && typeof m === 'object' && !Array.isArray(m)) {
            const first = Object.values(m)[0];
            if (typeof first === 'string') return first;
        }
    } catch { /* not JSON */ }
    return raw;
}

interface Props {
    designs: DashboardDesign[];
    loading: boolean;
}

export function ContinueDesigning({ designs, loading }: Props) {
    if (!loading && designs.length === 0) return null;

    return (
        <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-5">
                <h2 className="text-2xl font-bold text-gray-900">✏️ ออกแบบต่อจากที่ค้างไว้</h2>
                <Link to="/my-products" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                    ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-2xl aspect-[4/3] animate-pulse" />
                    ))
                    : designs.map(design => (
                        <Link
                            key={design.id}
                            to={`/test-canvas/${design.base_product_id}?designId=${design.id}`}
                            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
                        >
                            <div className="aspect-square bg-gray-50/50 flex items-center justify-center p-6 overflow-hidden">
                                {getFirstPreview(design.preview_image_url) ? (
                                    <img
                                        src={getFirstPreview(design.preview_image_url)}
                                        alt={design.design_name}
                                        className="h-full w-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">👕</div>
                                )}
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <p className="font-semibold text-gray-800 truncate text-sm">{design.design_name}</p>
                                <span className="flex items-center gap-1 text-primary text-xs font-bold shrink-0 ml-2">
                                    <Pencil className="w-3.5 h-3.5" /> แก้ไขต่อ
                                </span>
                            </div>
                        </Link>
                    ))
                }
            </div>
        </section>
    );
}
