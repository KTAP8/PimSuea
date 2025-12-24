import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

export default function MyOrders() {
  const orders = [
    { id: "ORD-001", date: "24/12/2025", items: "เสื้อยืด (x2)", total: "฿500", status: "กำลังผลิต", color: "bg-blue-100 text-blue-800" },
    { id: "ORD-002", date: "20/12/2025", items: "เสื้อฮู้ด (x1)", total: "฿590", status: "จัดส่งแล้ว", color: "bg-green-100 text-green-800" },
    { id: "ORD-003", date: "15/12/2025", items: "หมวกแก๊ป (x1)", total: "฿150", status: "ยกเลิก", color: "bg-red-100 text-red-800" },
  ];

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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{order.id}</td>
                  <td className="p-4 text-gray-500">{order.date}</td>
                  <td className="p-4">{order.items}</td>
                  <td className="p-4 font-bold">{order.total}</td>
                  <td className="p-4">
                    <Badge variant="outline" className={`border-0 ${order.color}`}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
