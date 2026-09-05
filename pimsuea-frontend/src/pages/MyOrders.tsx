import { Badge } from "@/components/ui/badge";
import { Package, Loader2, Eye, MapPin, CreditCard, ShoppingBag, Copy, Check, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/services/api";
import type { Order } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPreviewDisplayUrl } from "@/lib/previews";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrder } from "@/services/api";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDate, formatMoney } from "@/i18n/localeFormat";
import { getOrderStatusInfo } from "@/translations/app/orders";

function paymentMethodLabel(method: string | null | undefined, o: ReturnType<typeof useLanguage>['t']['orders']): string {
  switch (method) {
    case 'stripe_promptpay':
      return o.paymentPromptPay;
    case 'stripe_card':
      return o.paymentCard;
    case 'stripe':
      return o.paymentStripe;
    default:
      return method || o.paymentLegacy;
  }
}

export default function MyOrders() {
  const { t, lang } = useLanguage();
  const o = t.orders;
  const common = t.common;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  
  const [copiedOrderId, setCopiedOrderId] = useState<number | null>(null);

  const [notification, setNotification] = useState<{type: 'success' | 'error', title: string, message: string} | null>(null);

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError(o.loadError);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [o.loadError]);

  const handleEditClick = () => {
      if (selectedOrder?.shipping_address) {
          setEditForm(selectedOrder.shipping_address);
          setIsEditingAddress(true);
      }
  };

  const handleSaveAddress = async () => {
      if (!selectedOrder) return;
      setSaving(true);
      setNotification(null);
      try {
          await updateOrder(selectedOrder.id, { shipping_address: editForm });
          
          const updatedOrder = { ...selectedOrder, shipping_address: editForm };
          setSelectedOrder(updatedOrder);
          setOrders(prev => prev.map(ord => ord.id === selectedOrder.id ? updatedOrder : ord));
          
          setIsEditingAddress(false);
          setNotification({
              type: 'success',
              title: o.success,
              message: o.addressSaved
          });
      } catch (err) {
          console.error("Failed to update address:", err);
          setNotification({
              type: 'error',
              title: common.error,
              message: o.addressSaveFailed
          });
      } finally {
          setSaving(false);
      }
  };
  
  const canEditAddress = (status: string) => {
      return ['pending_payment', 'pending', 'paid_processing'].includes(status);
  };
  
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
        <Package className="mr-3" /> {o.historyTitle}
      </h1>

      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            {o.emptyHistory}
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = getOrderStatusInfo(lang, order.status);
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
                  {formatDate(lang, order.created_at, dateTimeOptions)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{formatMoney(order.total_amount, lang)}</span>
                  <span className="text-sm text-primary font-medium flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {o.viewDetails}
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
                <th className="p-4 font-semibold text-gray-600">{o.title}</th>
                <th className="p-4 font-semibold text-gray-600">{o.date}</th>
                <th className="p-4 font-semibold text-gray-600">{o.total}</th>
                <th className="p-4 font-semibold text-gray-600">{o.status}</th>
                <th className="p-4 font-semibold text-gray-600 text-right">{o.orderDetail}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                        {o.emptyHistory}
                    </td>
                </tr>
              ) : (
                orders.map((order) => {
                    const statusInfo = getOrderStatusInfo(lang, order.status);
                    return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium">#{order.id}</td>
                        <td className="p-4 text-gray-500">
                            {formatDate(lang, order.created_at, dateTimeOptions)}
                        </td>
                        <td className="p-4 font-bold">{formatMoney(order.total_amount, lang)}</td>
                        <td className="p-4">
                            <Badge variant="outline" className={`border-0 ${statusInfo.color}`}>
                            {statusInfo.label}
                            </Badge>
                        </td>
                         <td className="p-4 text-right">
                             <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(order); setIsEditingAddress(false); setNotification(null); }}>
                                 <Eye className="w-4 h-4 mr-2" /> {o.viewDetails}
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
            <DialogTitle className="text-2xl">{o.orderDetail}</DialogTitle>
            <DialogDescription className="text-base">
                {o.orderNumber} #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
                  <div className="space-y-8 pb-8">

                    <div className="bg-gray-50 p-6 rounded-xl border">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-600 font-medium">{o.orderStatus}</span>
                            <Badge className={getOrderStatusInfo(lang, selectedOrder.status).color}>
                                {getOrderStatusInfo(lang, selectedOrder.status).label}
                            </Badge>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">{o.orderDate}</span>
                            <span>{formatDate(lang, selectedOrder.created_at, { dateStyle: 'long', timeStyle: 'short' })}</span>
                        </div>
                    </div>

                    {selectedOrder.status === 'pending_payment' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
                        <p className="font-semibold text-green-800 flex items-center gap-2">
                          <MessageCircle className="w-5 h-5" /> {o.paymentHelp}
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
                              ? <><Check className="w-4 h-4 mr-1" /> {o.copied}</>
                              : <><Copy className="w-4 h-4 mr-1" /> {o.copy}</>
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

                    <div>
                        <h3 className="font-semibold mb-4 flex items-center text-lg"><ShoppingBag className="w-5 h-5 mr-3"/> {o.items}</h3>
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
                                                        <span className="ml-2 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{o.gift}</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">{o.productId} {item.id}</p>
                                                {item.is_gift && item.gift_recipient && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {o.sendTo} {item.gift_recipient.fullName} ({item.gift_recipient.phone})
                                                    </p>
                                                )}
                                                {item.is_gift && item.gift_message && (
                                                    <p className="text-sm text-gray-500 mt-1 italic">{o.giftCard} "{item.gift_message}"</p>
                                                )}
                                            </div>
                                            <div className="flex justify-between mt-2 text-base">
                                                <span className="text-gray-600">{o.quantity} {item.quantity} {common.pieces}</span>
                                                <span className="font-bold">
                                                    {formatMoney(item.price, lang)}
                                                    {item.is_gift && item.addon_fee_thb ? (
                                                        <span className="text-sm text-primary font-normal ml-1">+{formatMoney(item.addon_fee_thb, lang)} {o.giftAddon}</span>
                                                    ) : null}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic p-4 text-center border rounded-xl">{o.noItems}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold flex items-center text-lg"><MapPin className="w-5 h-5 mr-3"/> {o.shippingAddress}</h3>
                                {canEditAddress(selectedOrder.status) && !isEditingAddress && (
                                    <Button variant="outline" size="sm" onClick={handleEditClick}>
                                        {common.edit}
                                    </Button>
                                )}
                             </div>
                             
                             {isEditingAddress ? (
                                 <div className="border p-6 rounded-xl space-y-4 bg-white">
                                     <div className="grid grid-cols-1 gap-2">
                                         <Label>{o.fullName}</Label>
                                         <Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
                                     </div>
                                     <div className="grid grid-cols-1 gap-2">
                                         <Label>{o.phone}</Label>
                                         <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                                     </div>
                                      <div className="grid grid-cols-1 gap-2">
                                         <Label>{o.address}</Label>
                                         <Input value={editForm.addressLine1} onChange={e => setEditForm({...editForm, addressLine1: e.target.value})} />
                                     </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                         <div>
                                            <Label>{o.district}</Label>
                                            <Input value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} />
                                         </div>
                                         <div>
                                            <Label>{o.province}</Label>
                                            <Input value={editForm.province} onChange={e => setEditForm({...editForm, province: e.target.value})} />
                                         </div>
                                     </div>
                                      <div className="grid grid-cols-1 gap-2">
                                         <Label>{o.postalCode}</Label>
                                         <Input value={editForm.postalCode} onChange={e => setEditForm({...editForm, postalCode: e.target.value})} />
                                     </div>
                                     <div className="flex gap-2 pt-2">
                                         <Button onClick={handleSaveAddress} disabled={saving} className="flex-1">
                                             {saving ? <Loader2 className="animate-spin w-4 h-4"/> : common.save}
                                         </Button>
                                         <Button variant="ghost" onClick={() => setIsEditingAddress(false)} disabled={saving} className="flex-1">
                                             {common.cancel}
                                         </Button>
                                     </div>
                                 </div>
                             ) : (
                                selectedOrder.shipping_address ? (
                                    <div className="border p-6 rounded-xl text-sm space-y-2 h-full">
                                        <p className="font-bold text-base">{selectedOrder.shipping_address.fullName}</p>
                                        <p className="text-gray-600">{o.phoneLabel} {selectedOrder.shipping_address.phone}</p>
                                        <hr className="my-2"/>
                                        <p className="text-gray-700">{selectedOrder.shipping_address.addressLine1} {selectedOrder.shipping_address.addressLine2}</p>
                                        <p className="text-gray-700">{selectedOrder.shipping_address.district} {selectedOrder.shipping_address.province} {selectedOrder.shipping_address.postalCode}</p>
                                    </div>
                                ) : (
                                    <div className="border p-6 rounded-xl text-sm text-gray-500 italic h-full bg-gray-50 flex items-center justify-center">
                                        {o.noShippingAddress}
                                    </div>
                                )
                             )}
                        </div>

                        <div>
                             <h3 className="font-semibold mb-4 flex items-center text-lg"><CreditCard className="w-5 h-5 mr-3"/> {o.payment}</h3>
                             <div className="border p-6 rounded-xl h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600">{o.transactionType}</span>
                                    <span className="font-medium text-right">{paymentMethodLabel(selectedOrder.payment_method, o)}</span>
                                </div>
                                <div className="pt-4 border-t mt-auto">
                                    <div className="flex justify-between items-center text-xl font-bold">
                                        <span>{o.netTotal}</span>
                                        <span className="text-primary">{formatMoney(selectedOrder.total_amount, lang)}</span>
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
