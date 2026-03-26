import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Order } from '@/types/api';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending_payment: { label: 'รอชำระเงิน',          color: 'bg-yellow-100 text-yellow-800' },
    pending:         { label: 'รอดำเนินการ',           color: 'bg-blue-50 text-blue-800' },
    paid_processing: { label: 'ชำระแล้ว & กำลังผลิต', color: 'bg-blue-100 text-blue-800' },
    shipped:         { label: 'จัดส่งแล้ว',            color: 'bg-green-100 text-green-800' },
};

interface Props {
    orders: Order[];
    loading: boolean;
}

export function OngoingOrders({ orders, loading }: Props) {
    if (!loading && orders.length === 0) return null;

    return (
        <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-5">
                <h2 className="text-2xl font-bold text-gray-900">📦 คำสั่งซื้อที่กำลังดำเนินการ</h2>
                <Link to="/orders" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                    ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="flex flex-col gap-3">
                {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />
                    ))
                    : orders.map(order => {
                        const status = STATUS_MAP[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-800' };
                        const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) ?? 0;
                        return (
                            <Link
                                key={order.id}
                                to="/orders"
                                className="group bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">คำสั่งซื้อ #{order.id}</p>
                                        {itemCount > 0 && (
                                            <p className="text-xs text-gray-500 mt-0.5">{itemCount} ชิ้น · ฿{order.total_amount.toLocaleString()}</p>
                                        )}
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                            </Link>
                        );
                    })
                }
            </div>
        </section>
    );
}
