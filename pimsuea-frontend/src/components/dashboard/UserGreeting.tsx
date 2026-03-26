import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Palette, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface Props {
    stats: DashboardStats;
}

export function UserGreeting({ stats }: Props) {
    const { profile } = useAuth();
    const { cartCount } = useCart();
    const name = profile?.first_name ?? null;

    const statCards = [
        {
            label: 'คำสั่งซื้อของคุณ',
            value: stats.loading ? '–' : String(stats.ongoingCount),
            icon: <ShoppingBag className="w-5 h-5" />,
            to: '/orders',
        },
        {
            label: 'ดีไซน์ที่บันทึกไว้',
            value: stats.loading ? '–' : String(stats.designCount),
            icon: <Palette className="w-5 h-5" />,
            to: '/my-products',
        },
        {
            label: 'สินค้าในตะกร้า',
            value: String(cartCount),
            icon: <ShoppingCart className="w-5 h-5" />,
            to: '/checkout',
        },
    ];

    return (
        <div className="container mx-auto px-4 pt-10 pb-4">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6 font-display">
                สวัสดี{name ? `, คุณ ${name}` : ''}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statCards.map((card, idx) => (
                    <Link key={idx} to={card.to}
                        className="group flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {card.icon}
                            </div>
                            <div className="flex flex-col">
                                <p className="text-2xl font-bold text-slate-900 leading-none mb-1 shadow-sm">{card.value}</p>
                                <p className="text-sm font-normal text-slate-500 leading-tight group-hover:text-slate-700 transition-colors">{card.label}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
