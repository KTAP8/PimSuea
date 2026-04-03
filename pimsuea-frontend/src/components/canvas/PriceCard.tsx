import { Loader2, HelpCircle } from 'lucide-react';
import type { CanvasPriceBreakdown } from '../../types/canvas';

const DTF_GUIDE_URL = '/news/1'; // ← update with the real article ID from Supabase

interface Props {
    priceBreakdown: CanvasPriceBreakdown | null;
    priceLoading: boolean;
    printingType: string;
}

export function PriceCard({ priceBreakdown, priceLoading, printingType }: Props) {
    return (
        <div className="w-48 bg-white p-3 rounded-xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">ราคาโดยประมาณ</span>
                {priceLoading
                    ? <Loader2 className="w-3 h-3 text-gray-300 animate-spin" />
                    : <span className="text-[9px] text-gray-300">1 ชิ้น</span>
                }
            </div>
            {!priceLoading && priceBreakdown && (
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                    {priceBreakdown.color_name ? (
                        <>
                            {priceBreakdown.color_hex && (
                                <span
                                    className="w-2.5 h-2.5 rounded-full border border-gray-200 shrink-0"
                                    style={{ backgroundColor: priceBreakdown.color_hex }}
                                />
                            )}
                            <span className="text-[10px] text-gray-500 truncate">{priceBreakdown.color_name}</span>
                        </>
                    ) : (
                        <span className="text-[10px] text-gray-400">ราคาเดียวทุกสี</span>
                    )}
                </div>
            )}

            {priceLoading ? (
                <div className="space-y-2 py-1">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/5 mt-3" />
                </div>
            ) : priceBreakdown ? (
                <>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>เสื้อ</span>
                        <span>฿{priceBreakdown.shirt_per_unit.toLocaleString()}</span>
                    </div>
                    {priceBreakdown.sides.map(s => (
                        <div key={s.side} className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>พิมพ์ {s.side} <span className="text-gray-300">({s.tier})</span></span>
                            <span>฿{s.print_per_unit.toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2 mt-1">
                        <span>รวม/ชิ้น</span>
                        <span className="text-teal-700">฿{priceBreakdown.total_per_unit.toLocaleString()}</span>
                    </div>
                </>
            ) : (
                <p className="text-xs text-gray-300 text-center py-3">บันทึกเพื่อดูราคา</p>
            )}
            {printingType === 'DTF' && (
                <div className="mt-2 pt-2 border-t border-amber-100 bg-amber-50 -mx-3 -mb-3 px-3 pb-3 rounded-b-xl">
                    <div className="flex items-start justify-between gap-1">
                        <p className="text-[9px] text-amber-700 leading-relaxed">
                            ⚠ DTF: เส้นกราฟิกต้องหนา ≥ 2mm ถ้าหากเล็กกว่า 2mm แนะนำให้เพิ่มพื้นหลังสีขาวเพื่อให้กาวยึดติดดีขึ้น
                        </p>
                        <a href={DTF_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors mt-0.5">
                            <HelpCircle className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
