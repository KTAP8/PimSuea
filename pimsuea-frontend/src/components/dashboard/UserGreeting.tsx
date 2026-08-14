import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Palette, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
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
        <div className="container mx-auto px-4 pt-10 pb-4 relative z-10">
            <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-2xl font-semibold text-slate-900 mb-6 font-display"
            >
                สวัสดี{name ? `, คุณ ${name}` : ''}
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {statCards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 + (idx * 0.1) }}
                    >
                        <Link to={card.to}
                            className="group flex items-center justify-between bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(8,99,109,0.12)] hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                            
                            {/* Decorative background gradient on hover */}
                            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 rounded-xl bg-slate-100/80 text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                                    {card.icon}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{card.value}</p>
                                    <p className="text-sm font-medium text-slate-500 leading-tight group-hover:text-primary transition-colors">{card.label}</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all relative z-10" />
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
