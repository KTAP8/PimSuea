import { Fragment } from 'react';
import { Loader2 } from 'lucide-react';
import type { CanvasPriceBreakdown } from '../../types/canvas';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
    priceBreakdown: CanvasPriceBreakdown | null;
    priceLoading: boolean;
}

export function PriceCard({ priceBreakdown, priceLoading }: Props) {
    const { t } = useLanguage();
    const s = t.studio;

    return (
        <div className="w-full min-w-[17rem] max-w-sm bg-white p-3.5 rounded-xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">{s.estimatedPrice}</span>
                {priceLoading
                    ? <Loader2 className="w-3 h-3 text-gray-300 animate-spin" />
                    : <span className="text-[9px] text-gray-300">{s.onePiece}</span>
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
                        <span className="text-[10px] text-gray-400">{s.samePriceAllColors}</span>
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
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-xs text-gray-500">
                        <span className="min-w-0 leading-snug">{s.shirt}</span>
                        <span className="tabular-nums text-right whitespace-nowrap">
                            ฿{priceBreakdown.shirt_per_unit.toLocaleString()}
                        </span>
                        {priceBreakdown.sides.map(side => (
                            <Fragment key={side.side}>
                                <span className="min-w-0 leading-snug">
                                    {s.printSide}{' '}
                                    <span className="whitespace-nowrap">{side.side}</span>{' '}
                                    <span className="text-gray-300 whitespace-nowrap">({side.tier})</span>
                                </span>
                                <span className="tabular-nums text-right whitespace-nowrap">
                                    ฿{side.print_per_unit.toLocaleString()}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 text-sm font-bold border-t border-gray-100 pt-2.5 mt-2">
                        <span>{s.totalPerPiece}</span>
                        <span className="text-teal-700 tabular-nums text-right whitespace-nowrap">
                            ฿{priceBreakdown.total_per_unit.toLocaleString()}
                        </span>
                    </div>
                </>
            ) : (
                <p className="text-xs text-gray-300 text-center py-3">{s.saveToSeePrice}</p>
            )}
        </div>
    );
}
