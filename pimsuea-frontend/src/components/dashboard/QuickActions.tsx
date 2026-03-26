import { Link } from 'react-router-dom';
import { Sparkles, PenLine, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface Props {
    stats: DashboardStats;
}

export function QuickActions({ stats }: Props) {
    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-3">
                <Link to="/catalog">
                    <Button size="lg" className="rounded-2xl gap-2 shadow-sm">
                        <Sparkles className="w-4 h-4" /> เริ่มออกแบบใหม่
                    </Button>
                </Link>
                {!stats.loading && stats.designCount > 0 && (
                    <Link to="/my-products">
                        <Button size="lg" variant="outline" className="rounded-2xl gap-2">
                            <PenLine className="w-4 h-4" /> ออกแบบต่อจากที่ค้างไว้
                        </Button>
                    </Link>
                )}
                {!stats.loading && stats.ongoingCount > 0 && (
                    <Link to="/orders">
                        <Button size="lg" variant="ghost" className="rounded-2xl gap-2 text-gray-600">
                            <Package className="w-4 h-4" /> ดูคำสั่งซื้อ
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
