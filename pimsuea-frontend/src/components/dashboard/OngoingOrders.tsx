import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import type { Order } from '@/types/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { orderStatusLabels } from '@/translations/app/dashboard';
import { formatMoney } from '@/i18n/localeFormat';

const STATUS_COLORS: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-50 text-blue-800',
    paid_processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-green-100 text-green-800',
};

interface Props {
    orders: Order[];
    loading: boolean;
}

export function OngoingOrders({ orders, loading }: Props) {
    const { t, lang } = useLanguage();
    const d = t.dashboard;
    const c = t.common;
    const statusLabels = orderStatusLabels(lang);

    if (!loading && orders.length === 0) return null;

    return (
        <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-slate-900">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <Package className="w-6 h-6" />
                    </div>
                    {d.ongoingOrders}
                </h2>
                <Link to="/orders" className="text-sm text-primary hover:underline font-normal flex items-center gap-1.5 transition-colors">
                    {c.viewAll} <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex flex-col gap-4">
                {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-slate-100 rounded-3xl h-24 animate-pulse" />
                    ))
                    : orders.map(order => {
                        const statusLabel = statusLabels[order.status] ?? order.status;
                        const statusColor = STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800';
                        const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) ?? 0;
                        return (
                            <Link
                                key={order.id}
                                to="/orders"
                                className="group bg-white ring-1 ring-slate-900/5 rounded-3xl p-5 md:px-6 md:py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out flex items-center justify-between"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                    <div>
                                        <p className="font-semibold text-slate-900 text-base">{d.orderNumber}{order.id}</p>
                                        {itemCount > 0 && (
                                            <p className="text-sm text-slate-500 mt-0.5 flex gap-1.5 font-normal">
                                              <span>{itemCount} {c.pieces}</span> 
                                              <span>·</span> 
                                              <span className="font-medium text-slate-700">{formatMoney(order.total_amount, lang)}</span>
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full w-fit ${statusColor}`}>
                                        {statusLabel}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-full items-center justify-center bg-slate-50 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 shrink-0 ml-4 hidden sm:flex">
                                    <ArrowRight className="w-5 h-5 text-slate-700" />
                                </div>
                            </Link>
                        );
                    })
                }
            </div>
        </section>
    );
}
