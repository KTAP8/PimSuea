import { Badge } from "@/components/ui/badge";
import { Package, Loader2, Eye, MapPin, CreditCard, ShoppingBag, Copy, Check, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/services/api";
import type { Order } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPreviewDisplayUrl } from "@/lib/previews";

const statusMap: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "รอชำระเงิน", color: "bg-yellow-100 text-yellow-800" },
  pending: { label: "รอดำเนินการ", color: "bg-blue-50 text-blue-800" },
  paid_processing: { label: "ชำระแล้ว & กำลังผลิต", color: "bg-blue-100 text-blue-800" },
  printing: { label: "กำลังพิมพ์", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "จัดส่งแล้ว", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "ส่งถึงปลายทาง", color: "bg-green-100 text-green-800" },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
};

function paymentMethodLabel(method?: string | null): string {
  switch (method) {
    case 'stripe_promptpay':
      return 'PromptPay (Stripe)';
    case 'stripe_card':
      return 'บัตรเครดิต/เดบิต (Stripe)';
    case 'stripe':
      return 'Stripe';
    default:
      return method || 'โอนเงินผ่านธนาคาร (คำสั่งซื้อเก่า)';
  }
}

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrder } from "@/services/api";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";



export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Edit State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  
  const [copiedOrderId, setCopiedOrderId] = useState<number | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{type: 'success' | 'error', title: string, message: string} | null>(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    // ... existing fetchOrders ...
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

  const handleEditClick = () => {
      if (selectedOrder?.shipping_address) {
          setEditForm(selectedOrder.shipping_address);
          setIsEditingAddress(true);
      }
  };

  const handleSaveAddress = async () => {
      if (!selectedOrder) return;
      setSaving(true);
      setNotification(null); // Clear previous
      try {
          await updateOrder(selectedOrder.id, { shipping_address: editForm });
          
          // Update local state
          const updatedOrder = { ...selectedOrder, shipping_address: editForm };
          setSelectedOrder(updatedOrder);
          setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
          
          setIsEditingAddress(false);
          setNotification({
              type: 'success',
              title: 'สำเร็จ',
              message: 'บันทึกที่อยู่เรียบร้อยแล้ว'
          });
      } catch (error) {
          console.error("Failed to update address:", error);
          setNotification({
              type: 'error',
              title: 'เกิดข้อผิดพลาด',
              message: 'ไม่สามารถบันทึกที่อยู่ได้ กรุณาลองใหม่อีกครั้ง'
          });
      } finally {
          setSaving(false);
      }
  };
  
  const canEditAddress = (status: string) => {
      return ['pending_payment', 'pending', 'paid_processing'].includes(status);
  };
  
  // ... existing loading/error checks ...

  // ... start return ...
  
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
      {/* ... header and table ... */}
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <Package className="mr-3" /> ประวัติการสั่งซื้อ
      </h1>

      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            ยังไม่มีประวัติการสั่งซื้อ
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = statusMap[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => { setSelectedOrder(order); setIsEditingAddress(false); setNotification(null); }}
                className="w-full text-left bg-white rounded-xl border p-4 shadow-sm active:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-semibold text-gray-900">#{order.id}</span>
                  <Badge variant="outline" className={`border-0 shrink-0 ${statusInfo.color}`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(order.created_at).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">฿{order.total_amount.toLocaleString()}</span>
                  <span className="text-sm text-primary font-medium flex items-center gap-1">
                    <Eye className="w-4 h-4" /> ดูรายละเอียด
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">คำสั่งซื้อ</th>
                <th className="p-4 font-semibold text-gray-600">วันที่</th>
                <th className="p-4 font-semibold text-gray-600">ยอดรวม</th>
                <th className="p-4 font-semibold text-gray-600">สถานะ</th>
                <th className="p-4 font-semibold text-gray-600 text-right">รายละเอียด</th>
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
                            {new Date(order.created_at).toLocaleString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </td>
                        <td className="p-4 font-bold">฿{order.total_amount.toLocaleString()}</td>
                        <td className="p-4">
                            <Badge variant="outline" className={`border-0 ${statusInfo.color}`}>
                            {statusInfo.label}
                            </Badge>
                        </td>
                         <td className="p-4 text-right">
                             <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(order); setIsEditingAddress(false); setNotification(null); }}>
                                 <Eye className="w-4 h-4 mr-2" /> ดูรายละเอียด
                             </Button>
                        </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

       <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 md:p-8 pb-4">
            <DialogTitle className="text-2xl">รายละเอียดคำสั่งซื้อ</DialogTitle>
            <DialogDescription className="text-base">
                หมายเลขคำสั่งซื้อ #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
                  <div className="space-y-8 pb-8">



                    <div className="bg-gray-50 p-6 rounded-xl border">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-600 font-medium">สถานะคำสั่งซื้อ</span>
                            <Badge className={statusMap[selectedOrder.status]?.color || "bg-gray-100"}>
                                {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                            </Badge>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">วันที่สั่งซื้อ</span>
                            <span>{new Date(selectedOrder.created_at).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}</span>
                        </div>
                    </div>

                    {/* Payment support via LINE */}
                    {selectedOrder.status === 'pending_payment' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
                        <p className="font-semibold text-green-800 flex items-center gap-2">
                          <MessageCircle className="w-5 h-5" /> มีปัญหาการชำระเงิน? ส่งหมายเลขคำสั่งซื้อมาที่ LINE
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-white border border-green-200 rounded-lg px-4 py-2 font-mono font-bold text-lg">
                            #{selectedOrder.id}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-green-300 text-green-800 hover:bg-green-100"
                            onClick={() => {
                              navigator.clipboard.writeText(String(selectedOrder.id));
                              setCopiedOrderId(selectedOrder.id);
                              setTimeout(() => setCopiedOrderId(null), 2000);
                            }}
                          >
                            {copiedOrderId === selectedOrder.id
                              ? <><Check className="w-4 h-4 mr-1" /> คัดลอกแล้ว</>
                              : <><Copy className="w-4 h-4 mr-1" /> คัดลอก</>
                            }
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          {import.meta.env.VITE_LINE_QR_URL && (
                            <img
                              src={import.meta.env.VITE_LINE_QR_URL}
                              alt="LINE QR Code"
                              className="w-20 h-20 object-contain border border-green-200 rounded-lg bg-white p-1"
                            />
                          )}
                          <div>
                            <p className="text-sm text-green-700">LINE ID:</p>
                            <p className="text-lg font-bold text-green-700">{import.meta.env.VITE_LINE_ID || '@PimSuea'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items Section */}
                    {/* ... */}
                    <div>
                        <h3 className="font-semibold mb-4 flex items-center text-lg"><ShoppingBag className="w-5 h-5 mr-3"/> รายการสินค้า</h3>
                        <div className="space-y-4">
                            {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                selectedOrder.items.map((item) => (
                                    <div key={item.id} className="flex gap-6 border p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                        <img
                                            src={getPreviewDisplayUrl(item.image) || "https://via.placeholder.com/100"} 
                                            alt={item.product_name} 
                                            className="w-20 h-20 object-cover rounded-lg bg-gray-100 border"
                                        />
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="font-semibold text-lg line-clamp-1">
                                                    {item.product_name}
                                                    {item.is_gift && (
                                                        <span className="ml-2 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">ของขวัญ</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">รหัสสินค้า: {item.id}</p>
                                                {item.is_gift && item.gift_recipient && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        ส่งถึง: {item.gift_recipient.fullName} ({item.gift_recipient.phone})
                                                    </p>
                                                )}
                                                {item.is_gift && item.gift_message && (
                                                    <p className="text-sm text-gray-500 mt-1 italic">การ์ด: "{item.gift_message}"</p>
                                                )}
                                            </div>
                                            <div className="flex justify-between mt-2 text-base">
                                                <span className="text-gray-600">จำนวน: {item.quantity} ชิ้น</span>
                                                <span className="font-bold">
                                                    ฿{item.price.toLocaleString()}
                                                    {item.is_gift && item.addon_fee_thb ? (
                                                        <span className="text-sm text-primary font-normal ml-1">+฿{item.addon_fee_thb.toLocaleString()} ของขวัญ</span>
                                                    ) : null}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic p-4 text-center border rounded-xl">ไม่พบรายการสินค้า</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Shipping Address */}
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold flex items-center text-lg"><MapPin className="w-5 h-5 mr-3"/> ที่อยู่ติดต่อ / จัดส่ง (ผู้สั่ง)</h3>
                                {canEditAddress(selectedOrder.status) && !isEditingAddress && (
                                    <Button variant="outline" size="sm" onClick={handleEditClick}>
                                        แก้ไข
                                    </Button>
                                )}
                             </div>
                             
                             {isEditingAddress ? (
                                 <div className="border p-6 rounded-xl space-y-4 bg-white">
                                     <div className="grid grid-cols-1 gap-2">
                                         <Label>ชื่อ-นามสกุล</Label>
                                         <Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
                                     </div>
                                     <div className="grid grid-cols-1 gap-2">
                                         <Label>เบอร์โทรศัพท์</Label>
                                         <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                                     </div>
                                      <div className="grid grid-cols-1 gap-2">
                                         <Label>ที่อยู่</Label>
                                         <Input value={editForm.addressLine1} onChange={e => setEditForm({...editForm, addressLine1: e.target.value})} />
                                     </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                         <div>
                                            <Label>แขวง/ตำบล</Label>
                                            <Input value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} />
                                         </div>
                                         <div>
                                            <Label>จังหวัด</Label>
                                            <Input value={editForm.province} onChange={e => setEditForm({...editForm, province: e.target.value})} />
                                         </div>
                                     </div>
                                      <div className="grid grid-cols-1 gap-2">
                                         <Label>รหัสไปรษณีย์</Label>
                                         <Input value={editForm.postalCode} onChange={e => setEditForm({...editForm, postalCode: e.target.value})} />
                                     </div>
                                     <div className="flex gap-2 pt-2">
                                         <Button onClick={handleSaveAddress} disabled={saving} className="flex-1">
                                             {saving ? <Loader2 className="animate-spin w-4 h-4"/> : "บันทึก"}
                                         </Button>
                                         <Button variant="ghost" onClick={() => setIsEditingAddress(false)} disabled={saving} className="flex-1">
                                             ยกเลิก
                                         </Button>
                                     </div>
                                 </div>
                             ) : (
                                selectedOrder.shipping_address ? (
                                    <div className="border p-6 rounded-xl text-sm space-y-2 h-full">
                                        <p className="font-bold text-base">{selectedOrder.shipping_address.fullName}</p>
                                        <p className="text-gray-600">โทร: {selectedOrder.shipping_address.phone}</p>
                                        <hr className="my-2"/>
                                        <p className="text-gray-700">{selectedOrder.shipping_address.addressLine1} {selectedOrder.shipping_address.addressLine2}</p>
                                        <p className="text-gray-700">{selectedOrder.shipping_address.district} {selectedOrder.shipping_address.province} {selectedOrder.shipping_address.postalCode}</p>
                                    </div>
                                ) : (
                                    <div className="border p-6 rounded-xl text-sm text-gray-500 italic h-full bg-gray-50 flex items-center justify-center">
                                        ไม่พบข้อมูลที่อยู่จัดส่ง
                                    </div>
                                )
                             )}
                        </div>

                         {/* Payment/Transaction info */}
                        <div>
                             <h3 className="font-semibold mb-4 flex items-center text-lg"><CreditCard className="w-5 h-5 mr-3"/> การชำระเงิน</h3>
                             <div className="border p-6 rounded-xl h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600">ประเภทธุรกรรม</span>
                                    <span className="font-medium text-right">{paymentMethodLabel(selectedOrder.payment_method)}</span>
                                </div>
                                <div className="pt-4 border-t mt-auto">
                                    <div className="flex justify-between items-center text-xl font-bold">
                                        <span>ยอดรวมสุทธิ</span>
                                        <span className="text-primary">฿{selectedOrder.total_amount.toLocaleString()}</span>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                  </div>
              </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-100 w-full max-w-md animate-in fade-in slide-in-from-top-2">
            <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className={`shadow-lg ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle className="font-semibold">{notification.title}</AlertTitle>
                <AlertDescription>
                    {notification.message}
                </AlertDescription>
            </Alert>
        </div>
      )}
    </div>
  );
}
