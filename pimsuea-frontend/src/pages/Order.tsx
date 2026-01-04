import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getDesignById, getProductById, createOrder, getMyDesigns, getProductTemplates } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ShoppingCart, Truck, ChevronRight, Check, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Interfaces
interface CartItem {
  id: string; // unique ID for cart row
  designId: string;
  designName: string;
  designImage: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  availableSizes: string[];
  availableColors: any[]; // { id, name, hex_code }
  sizeGuide: any;
  pricingTiers: any[];
}

interface ShippingInfo {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  province: string;
  district: string;
  postalCode: string;
}

export default function Order() {
  // Router
  const [searchParams] = useSearchParams();
  const initialDesignId = searchParams.get('initialDesignId');
  const navigate = useNavigate();

  // Step State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Add Item Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [myDesigns, setMyDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState<{type: 'success' | 'error', title: string, message: string} | null>(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => {
            setNotification(null);
            // If success, navigate after dismiss
            if (notification.type === 'success') {
                 navigate('/orders');
            }
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [notification, navigate]);

  // Fetch designs when modal opens
  useEffect(() => {
      // ...
      if (isAddOpen && myDesigns.length === 0) {
          setLoadingDesigns(true);
          getMyDesigns().then(data => {
              setMyDesigns(data);
          }).finally(() => setLoadingDesigns(false));
      }
  }, [isAddOpen]);

  // Data State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '', phone: '', addressLine1: '', addressLine2: '', province: '', district: '', postalCode: ''
  });

  // Calculate Total
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Phase 1: Initialize Cart
  useEffect(() => {
    // ... no changes to initCart ...
    const initCart = async () => {
      if (initialDesignId && cartItems.length === 0) {
        setLoading(true);
        try {
            // Fetch Design
            const design = await getDesignById(initialDesignId);
            
            // Fetch Product & Templates
            const [product, templates] = await Promise.all([
                getProductById(design.base_product_id),
                getProductTemplates(design.base_product_id).catch(() => [])
            ]);
            
            // Safe Parsing Size Guide
            let sizeGuide = {};
            if (typeof product.size_guide === 'string') {
                 try { sizeGuide = JSON.parse(product.size_guide) } catch(e) {}
            } else {
                 sizeGuide = product.size_guide || {};
            }
            
            // Available Sizes
            const availableSizes = Object.keys(sizeGuide).length > 0 ? Object.keys(sizeGuide) : ['S', 'M', 'L', 'XL'];
            
            // Available Colors (Unique)
            let allProductColors = Array.from(new Map(
                templates.map((t: any) => [t.color?.id, t.color])
            ).values()).filter(Boolean);

            // Filter by Design's Available Colors if present
            let availableColors: any[] = allProductColors;
            if (design.available_colors && Array.isArray(design.available_colors) && design.available_colors.length > 0) {
                 const allowedColorIds = new Set(design.available_colors);
                 availableColors = allProductColors.filter((c: any) => allowedColorIds.has(c.id));
                 
                 // Fallback if mismatch (shouldn't happen but safe to keep all if filtered list is empty?)
                 // Actually, if filtered is empty, it means IDs don't match, so fallback to all to prevent empty dropdown
                 if (availableColors.length === 0) availableColors = allProductColors;
            }

            // Pricing Tiers (use print_methods[0] for simplified logic if top-level missing)
            const pricingTiers = product.print_pricing_tiers || (product.print_methods?.[0]?.tiers) || [];

            // Initial Price Logic
            const quantity = 1;
            let initialPrice = product.starting_price || product.price || 500;
            
            if (pricingTiers.length > 0) {
                // Find tier
                const tier = pricingTiers
                    .filter((t: any) => quantity >= t.min_quantity)
                    .sort((a: any, b: any) => b.min_quantity - a.min_quantity)[0];
                if (tier) initialPrice = tier.unit_price;
            }

            const newItem: CartItem = {
                id: Math.random().toString(36).substr(2, 9),
                designId: design.id,
                designName: design.design_name,
                designImage: design.preview_image_url,
                productId: String(product.id),
                productName: product.name,
                size: availableSizes[0] || 'M',
                color: availableColors[0]?.name || 'Default', 
                quantity: quantity,
                price: initialPrice,
                availableSizes,
                availableColors,
                sizeGuide,
                pricingTiers
            };

            setCartItems([newItem]);

        } catch (error) {
            console.error("Failed to init order:", error);
        } finally {
            setLoading(false);
        }
      }
    };
    
    initCart();
  }, [initialDesignId]);


  const addToCart = async (design: any) => {
      // ... no changes to addToCart ...
      setLoading(true);
      setIsAddOpen(false); 
      try {
            // Fetch Product & Templates
            const [product, templates] = await Promise.all([
                getProductById(design.base_product_id),
                getProductTemplates(design.base_product_id).catch(() => [])
            ]);
            
            // Safe Parsing Size Guide
            let sizeGuide = {};
            if (typeof product.size_guide === 'string') {
                 try { sizeGuide = JSON.parse(product.size_guide) } catch(e) {}
            } else {
                 sizeGuide = product.size_guide || {};
            }
            
            // Available Sizes
            const availableSizes = Object.keys(sizeGuide).length > 0 ? Object.keys(sizeGuide) : ['S', 'M', 'L', 'XL'];
            
            // Available Colors (Unique)
            let allProductColors = Array.from(new Map(
                templates.map((t: any) => [t.color?.id, t.color])
            ).values()).filter(Boolean);

            // Filter by Design's Available Colors
            let availableColors: any[] = allProductColors;
            if (design.available_colors && Array.isArray(design.available_colors) && design.available_colors.length > 0) {
                 const allowedColorIds = new Set(design.available_colors);
                 availableColors = allProductColors.filter((c: any) => allowedColorIds.has(c.id));
                 if (availableColors.length === 0) availableColors = allProductColors;
            }

            // Pricing
            const pricingTiers = product.print_pricing_tiers || (product.print_methods?.[0]?.tiers) || [];
            
            const quantity = 1;
            let initialPrice = product.starting_price || product.price || 500;
             if (pricingTiers.length > 0) {
                const tier = pricingTiers
                    .filter((t: any) => quantity >= t.min_quantity)
                    .sort((a: any, b: any) => b.min_quantity - a.min_quantity)[0];
                if (tier) initialPrice = tier.unit_price;
            }

            const newItem: CartItem = {
                id: Math.random().toString(36).substr(2, 9),
                designId: design.id,
                designName: design.design_name,
                designImage: design.preview_image_url,
                productId: String(product.id),
                productName: product.name,
                size: availableSizes[0] || 'M',
                color: availableColors[0]?.name || 'Default', 
                quantity: quantity,
                price: initialPrice,
                availableSizes,
                availableColors,
                sizeGuide,
                pricingTiers
            };

            setCartItems(prev => [...prev, newItem]);

      } catch (error) {
          console.error("Failed to add item:", error);
      } finally {
          setLoading(false);
      }
  };

  const handleNext = () => {
      setStep(prev => Math.min(prev + 1, 3));
  };
  
  const handleBack = () => {
      setStep(prev => Math.max(prev - 1, 1));
  };

  const updateItem = (id: string, field: keyof CartItem, value: any) => {
      // ... same ...
      setCartItems(prev => prev.map(item => {
          if (item.id === id) {
              const updatedItem = { ...item, [field]: value };
              
              // Recalculate Price if Quantity Changed
              if (field === 'quantity' && item.pricingTiers.length > 0) {
                   const qty = value as number;
                   const tier = item.pricingTiers
                        .filter((t: any) => qty >= t.min_quantity)
                        .sort((a: any, b: any) => b.min_quantity - a.min_quantity)[0];
                   
                   if (tier) {
                       updatedItem.price = tier.unit_price;
                   }
              }
              
              return updatedItem;
          }
          return item;
      }));
  };

  const removeItem = (id: string) => {
      setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSubmit = async () => {
      setLoading(true);
      setNotification(null);
      try {
        const orderPayload = {
            items: cartItems,
            shipping: shippingInfo,
            total: totalPrice
        };
        console.log("SUBMITTING ORDER:", orderPayload);
        
        await createOrder(orderPayload);
        
        setNotification({
             type: 'success',
             title: 'สั่งซื้อสำเร็จ',
             message: 'ระบบบันทึกคำสั่งซื้อเรียบร้อยแล้ว'
        });
        
        // Navigation handled in useEffect
      } catch (error) {
          console.error("Order submission failed:", error);
          setNotification({
             type: 'error',
             title: 'เกิดข้อผิดพลาด',
             message: 'เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง'
          });
      } finally {
          setLoading(false);
      }
  };

  if (loading && cartItems.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Alert Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-md animate-in fade-in slide-in-from-top-2">
            <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className={`shadow-lg ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle className="font-semibold">{notification.title}</AlertTitle>
                <AlertDescription>
                    {notification.message}
                </AlertDescription>
            </Alert>
        </div>
      )}

      {/* Steps Indicator */}
      {/* ... same ... */}
      <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current">1</div>
              <span>ตะกร้าสินค้า</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current">2</div>
              <span>ที่อยู่จัดส่ง</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200 mx-4" />
           <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current">3</div>
              <span>สรุป & จ่ายเงิน</span>
          </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center"><ShoppingCart className="mr-2" /> ตะกร้าสินค้า</h2>
            
             {cartItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <p className="text-gray-500 mb-4">ยังไม่มีสินค้าในตะกร้า</p>
                    <Button onClick={() => navigate('/my-products')}>เลือกผลงานออกแบบ</Button>
                </div>
             ) : (
                 <div className="space-y-4">
                     {cartItems.map((item) => (
                         <div key={item.id} className="bg-white border rounded-xl p-4 flex gap-4 items-start">
                             <img src={item.designImage} alt={item.designName} className="w-24 h-24 object-contain bg-gray-50 rounded-md border" />
                             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                     <h3 className="font-semibold">{item.designName}</h3>
                                     <p className="text-sm text-gray-500">{item.productName}</p>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div>
                                         <Label className="text-xs">Size</Label>
                                         <select 
                                            className="w-full border rounded p-1 text-sm bg-gray-50 bg-opacity-30" 
                                            value={item.size}
                                            onChange={(e) => updateItem(item.id, 'size', e.target.value)}
                                         >
                                             {item.availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <Label className="text-xs">Color</Label>
                                          <select 
                                            className="w-full border rounded p-1 text-sm bg-gray-50 bg-opacity-30" 
                                            value={item.color} // This stores color NAME for now, might want to store ID or full object later
                                            onChange={(e) => updateItem(item.id, 'color', e.target.value)}
                                         >
                                             {item.availableColors.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <Label className="text-xs">Quantity</Label>
                                         <Input 
                                            type="number" 
                                            min={1} 
                                            value={item.quantity} 
                                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="h-8"
                                         />
                                     </div>
                                 </div>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                 <span className="font-bold text-lg">฿{(item.price * item.quantity).toLocaleString()}</span>
                                 <span className="text-xs text-gray-400">฿{item.price.toLocaleString()} / ชิ้น</span>
                                 <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)}>
                                     <Trash2 className="w-4 h-4" />
                                 </Button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}

             <div className="flex justify-between pt-4 border-t mt-4">
                 <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                     <SheetTrigger asChild>
                         <Button variant="ghost"><Plus className="w-4 h-4 mr-2"/> ซื้อสินค้าเพิ่ม</Button>
                     </SheetTrigger>
                     <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                         <SheetHeader>
                             <SheetTitle>เลือกผลงานออกแบบของฉัน</SheetTitle>
                         </SheetHeader>
                         <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                             {loadingDesigns ? (
                                 <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>
                             ) : (
                                 <div className="grid grid-cols-2 gap-4">
                                     {myDesigns.map(design => (
                                         <div key={design.id} 
                                            className="border rounded-lg p-2 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                                            onClick={() => addToCart(design)}
                                         >
                                             <img src={design.preview_image_url || "https://via.placeholder.com/150"} alt={design.design_name} className="w-full aspect-square object-contain bg-gray-50 mb-2 rounded" />
                                             <p className="font-medium text-sm truncate">{design.design_name}</p>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </ScrollArea>
                     </SheetContent>
                 </Sheet>

                 <div className="text-right">
                     <p className="text-gray-500">รวมทั้งหมด ({totalItems} ชิ้น)</p>
                     <p className="text-3xl font-bold text-primary">฿{totalPrice.toLocaleString()}</p>
                 </div>
             </div>
        </div>
      )}

      {step === 2 && (
          <div className="space-y-6 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold flex items-center"><Truck className="mr-2" /> ที่อยู่จัดส่ง</h2>
              <div className="grid grid-cols-1 gap-4">
                  <div>
                      <Label>ชื่อ-นามสกุล</Label>
                      <Input value={shippingInfo.fullName} onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})} />
                  </div>
                  <div>
                      <Label>เบอร์โทรศัพท์</Label>
                      <Input value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})} />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                             <Label>จังหวัด</Label>
                             <Input value={shippingInfo.province} onChange={(e) => setShippingInfo({...shippingInfo, province: e.target.value})} />
                        </div>
                        <div>
                             <Label>เขต/อำเภอ</Label>
                             <Input value={shippingInfo.district} onChange={(e) => setShippingInfo({...shippingInfo, district: e.target.value})} />
                        </div>
                   </div>
                   <div>
                         <Label>รหัสไปรษณีย์</Label>
                         <Input value={shippingInfo.postalCode} onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})} />
                   </div>
                   <div>
                       <Label>ที่อยู่ (บ้านเลขที่, ซอย, ถนน)</Label>
                       <Input value={shippingInfo.addressLine1} onChange={(e) => setShippingInfo({...shippingInfo, addressLine1: e.target.value})} />
                   </div>
              </div>
          </div>
      )}

      {step === 3 && (
          <div className="space-y-6">
               <h2 className="text-2xl font-bold flex items-center"><Check className="mr-2" /> ตรวจสอบรายการ</h2>
               <div className="bg-gray-50 p-6 rounded-xl border space-y-4">
                   <h3 className="font-semibold border-b pb-2">สรุปคำสั่งซื้อ</h3>
                   {cartItems.map(item => (
                       <div key={item.id} className="flex justify-between text-sm">
                           <span>{item.designName} ({item.size}) x {item.quantity}</span>
                           <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                       </div>
                   ))}
                   <div className="flex justify-between font-bold text-lg pt-2 border-t">
                       <span>ยอดรวมสุทธิ</span>
                       <span>฿{totalPrice.toLocaleString()}</span>
                   </div>
               </div>
               
               <div className="bg-gray-50 p-6 rounded-xl border">
                    <h3 className="font-semibold border-b pb-2 mb-2">ที่อยู่จัดส่ง</h3>
                    <p>{shippingInfo.fullName} ({shippingInfo.phone})</p>
                    <p>{shippingInfo.addressLine1} {shippingInfo.province} {shippingInfo.postalCode}</p>
               </div>
          </div>
      )}

      <div className="mt-8 flex justify-between">
          {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>ย้อนกลับ</Button>
          ) : null}
          
          {step < 3 ? (
              <Button onClick={handleNext} disabled={cartItems.length === 0}>
                  ดำเนินการต่อ <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
          ) : (
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                  ยืนยันการสั่งซื้อ
              </Button>
          )}
      </div>
    </div>
  );
}
