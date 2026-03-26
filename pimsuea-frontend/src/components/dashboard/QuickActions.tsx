import { Link } from 'react-router-dom';
import { Plus, PenLine, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface Props {
    stats: DashboardStats;
}

export function QuickActions({ stats }: Props) {
    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Link to="/catalog" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto rounded-xl gap-2 text-base h-12 shadow-sm font-semibold">
                        <Plus className="w-5 h-5" /> เริ่มออกแบบใหม่
                    </Button>
                </Link>
                {!stats.loading && stats.designCount > 0 && (
                    <Link to="/my-products" className="w-full sm:w-auto">
                        <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-xl gap-2 text-base h-12 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 border border-slate-100 font-medium text-slate-600 transition-colors">
                            <PenLine className="w-5 h-5 opacity-70" /> ออกแบบต่อจากที่ค้างไว้
                        </Button>
                    </Link>
                )}
                {!stats.loading && stats.ongoingCount > 0 && (
                    <Link to="/orders" className="w-full sm:w-auto">
                        <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-xl gap-2 text-base h-12 font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 transition-colors">
                            <Package className="w-5 h-5 opacity-70" /> ดูคำสั่งซื้อ
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
