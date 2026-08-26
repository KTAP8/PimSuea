import { useEffect, useState } from 'react';
import { getMyOrders, getMyDesigns } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Order } from '@/types/api';

const ONGOING_STATUSES = new Set(['pending_payment', 'pending', 'paid_processing', 'shipped']);

export interface DashboardDesign {
    id: string;
    design_name: string;
    preview_image_url: string;
    base_product_id: number;
    updated_at: string;
}

export interface DashboardStats {
    ongoingOrders: Order[];
    recentDesigns: DashboardDesign[];
    ongoingCount: number;
    designCount: number;
    loading: boolean;
}

export function useDashboardStats(): DashboardStats {
    const { session, loading: authLoading } = useAuth();
    const [ongoingOrders, setOngoingOrders] = useState<Order[]>([]);
    const [recentDesigns, setRecentDesigns] = useState<DashboardDesign[]>([]);
    const [designCount, setDesignCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            setLoading(false);
            return;
        }

        setLoading(true);
        Promise.all([getMyOrders(), getMyDesigns()])
            .then(([orders, designs]) => {
                const ongoing = (orders as Order[]).filter(o => ONGOING_STATUSES.has(o.status));
                setOngoingOrders(ongoing.slice(0, 2));

                const sorted = [...designs].sort(
                    (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
                );
                setRecentDesigns(sorted.slice(0, 3));
                setDesignCount(designs.length);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [authLoading, session]);

    return { ongoingOrders, recentDesigns, ongoingCount: ongoingOrders.length, designCount, loading };
}
