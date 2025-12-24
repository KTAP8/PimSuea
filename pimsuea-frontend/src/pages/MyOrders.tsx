import { Badge } from "@/components/ui/badge";
import { Package, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/services/api";
import type { Order } from "@/types/api";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "กำลังผลิต", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "จัดส่งแล้ว", color: "bg-green-100 text-green-800" },
  delivered: { label: "ส่งถึงปลายทาง", color: "bg-green-100 text-green-800" },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError("ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <Package className="mr-3" /> ประวัติการสั่งซื้อ
      </h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">หมายเลขคำสั่งซื้อ</th>
                <th className="p-4 font-semibold text-gray-600">วันที่</th>
                <th className="p-4 font-semibold text-gray-600">รายการ</th>
                <th className="p-4 font-semibold text-gray-600">ยอดรวม</th>
                <th className="p-4 font-semibold text-gray-600">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                        ยังไม่มีประวัติการสั่งซื้อ
                    </td>
                </tr>
              ) : (
                orders.map((order) => {
                    const statusInfo = statusMap[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
                    return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium">#{order.id}</td>
                        <td className="p-4 text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="p-4">
                            {order.items?.map(i => `${i.product_name} (x${i.quantity})`).join(', ') || 'สินค้าสั่งทำ'}
                        </td>
                        <td className="p-4 font-bold">฿{order.total_amount.toLocaleString()}</td>
                        <td className="p-4">
                            <Badge variant="outline" className={`border-0 ${statusInfo.color}`}>
                            {statusInfo.label}
                            </Badge>
                        </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
