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
            label: 'คำสั่งซื้อที่กำลังดำเนินการ',
            value: stats.loading ? '–' : String(stats.ongoingCount),
            icon: <ShoppingBag className="w-5 h-5" />,
            to: '/orders',
            accent: 'text-blue-600 bg-blue-50',
        },
        {
            label: 'ดีไซน์ที่บันทึกไว้',
            value: stats.loading ? '–' : String(stats.designCount),
            icon: <Palette className="w-5 h-5" />,
            to: '/my-products',
            accent: 'text-violet-600 bg-violet-50',
        },
        {
            label: 'สินค้าในตะกร้า',
            value: String(cartCount),
            icon: <ShoppingCart className="w-5 h-5" />,
            to: '/order',
            accent: 'text-amber-600 bg-amber-50',
        },
    ];

    return (
        <div className="container mx-auto px-4 pt-10 pb-2">
            <p className="text-2xl font-bold text-gray-900 mb-6">
                สวัสดี{name ? `, ${name}` : ''} 👋
            </p>
            <div className="grid grid-cols-3 gap-4">
                {statCards.map(card => (
                    <Link key={card.label} to={card.to}
                        className="group flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${card.accent}`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 leading-none">{card.value}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{card.label}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
