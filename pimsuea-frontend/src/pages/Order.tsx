import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getDesignById, getProductById, createOrder, getMyDesigns, getProductTemplates, getPrice } from "@/services/api";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ShoppingCart, Truck, ChevronRight, Check, Plus, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Interfaces
interface SidePriceBreakdown { side: string; tier: string; print_per_unit: number; }
interface ItemPriceBreakdown {
  sides: SidePriceBreakdown[];
  shirt_per_unit: number;
  total_print_per_unit: number;
  total_per_unit: number;
}

interface CartItem {
  id: string; // unique ID for cart row
  designId: string;
  designName: string;
  designImage: string;
  productId: string;
  productName: string;
  size: string;
  color: string;     // display name
  color_id: string;  // used for pricing lookup
  quantity: number;
  price: number;
  availableSizes: string[];
  availableColors: any[]; // { id, name, hex_code }
  sizeGuide: any;
  print_file_url?: string;
  printingType?: string;
  print_dimensions?: Record<string, { w: number; h: number }>;
  priceBreakdown?: ItemPriceBreakdown;
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

// Calculate price for all sides, sum print costs, add shirt once
async function calcMultiSidePrice(
  printingType: string,
  print_dimensions: Record<string, { w: number; h: number }>,
  quantity: number,
  productId: string,
  color_id: string,
  size: string,
  shirtQty?: number,
  printQty?: number,
): Promise<ItemPriceBreakdown | null> {
  const entries = Object.entries(print_dimensions).filter(([, d]) => d.w > 0 && d.h > 0);
  if (entries.length === 0) return null;

  // Fetch all sides in parallel
  const settled = await Promise.all(entries.map(async ([side, dims]) => {
    try {
      const bd = await getPrice({
        printingType: printingType as 'DTG' | 'DTF',
        aabb_w_cm: dims.w,
        aabb_h_cm: dims.h,
        quantity,
        shirt_qty: shirtQty,
        print_qty: printQty,
        productId,
        color_id,
        size,
      });
      return { side, tier: bd.tier, print_per_unit: bd.print_per_unit, shirt_per_unit: bd.shirt_per_unit };
    } catch { return null; }
  }));

  const sideResults = settled.filter((r): r is NonNullable<typeof r> => r !== null);
  if (sideResults.length === 0) return null;
  const shirt_per_unit = sideResults[0].shirt_per_unit;
  const total_print_per_unit = sideResults.reduce((s, r) => s + r.print_per_unit, 0);
  return { sides: sideResults, shirt_per_unit, total_print_per_unit, total_per_unit: shirt_per_unit + total_print_per_unit };
}

// Reprice all items using combined group quantities for tier lookup
async function repriceAll(items: CartItem[]): Promise<CartItem[]> {
  // Shirt group: productId:color_id → combined qty
  const shirtGroupQty = new Map<string, number>();
  for (const item of items) {
    const key = `${item.productId}:${item.color_id}`;
    shirtGroupQty.set(key, (shirtGroupQty.get(key) ?? 0) + item.quantity);
  }
  // Print group: designId → combined qty
  const printGroupQty = new Map<string, number>();
  for (const item of items) {
    printGroupQty.set(item.designId, (printGroupQty.get(item.designId) ?? 0) + item.quantity);
  }

  return Promise.all(items.map(async (item) => {
    if (!item.print_dimensions || !item.printingType) return item;
    const shirtQty = shirtGroupQty.get(`${item.productId}:${item.color_id}`) ?? item.quantity;
    const printQty = printGroupQty.get(item.designId) ?? item.quantity;
    const bd = await calcMultiSidePrice(
      item.printingType, item.print_dimensions, item.quantity,
      item.productId, item.color_id, item.size, shirtQty, printQty
    ).catch(() => null);
    return bd ? { ...item, price: bd.total_per_unit, priceBreakdown: bd } : item;
  }));
}

export default function Order() {
  // Router
  const [searchParams] = useSearchParams();
  const initialDesignId = searchParams.get('initialDesignId');
  const navigate = useNavigate();

  // Step State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addingDesignId, setAddingDesignId] = useState<string | null>(null);
  
  // Debounce ref for quantity repricing
  const repriceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Add Item Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [myDesigns, setMyDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState<{type: 'success' | 'error', title: string, message: string} | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-dismiss notification (errors only)
  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => {
            setNotification(null);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

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
  const { cartItems: contextCartItems, addToCart: ctxAddToCart, clearCart, removeFromCart, updateCartItem } = useCart();
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
            
            // Available Sizes — from shirt_pricing (authoritative)
            const availableSizes: string[] = product.available_sizes?.length
                ? product.available_sizes
                : ['S', 'M', 'L', 'XL', 'XXL'];

            // Keep size_guide for reference only (measurements display)
            let sizeGuide = {};
            if (typeof product.size_guide === 'string') {
                 try { sizeGuide = JSON.parse(product.size_guide) } catch(e) {}
            } else {
                 sizeGuide = product.size_guide || {};
            }
            
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

            // Initial Price via new pricing API
            const quantity = 1;
            const initialSize = availableSizes[0] || 'M';
            const initialColor = availableColors[0];
            const initialColorId = initialColor?.id || 'white';
            let initialPrice = product.starting_price || product.price || 500;
            let priceBreakdown: ItemPriceBreakdown | undefined;

            if (design.print_dimensions && design.printing_type) {
                const bd = await calcMultiSidePrice(design.printing_type, design.print_dimensions, quantity, String(design.base_product_id), initialColorId, initialSize).catch(() => null);
                if (bd) { priceBreakdown = bd; initialPrice = bd.total_per_unit; }
            }

            // Persist to CartContext/DB (check for duplicate first)
            const existingCtx = contextCartItems.find(i => i.design_id === design.id);
            const ctxId = existingCtx?.id ?? ctxAddToCart({
                product_id: design.base_product_id,
                color_id: initialColorId,
                size: initialSize,
                quantity,
                design_id: design.id,
                print_file_url: design.print_file_url || '',
                design_json: {},
                preview_url: design.preview_image_url,
                design_name: design.design_name,
            });

            const newItem: CartItem = {
                id: ctxId,
                designId: design.id,
                designName: design.design_name,
                designImage: design.preview_image_url,
                productId: String(product.id),
                productName: product.name,
                size: initialSize,
                color: initialColor?.name || 'Default',
                color_id: initialColorId,
                quantity,
                price: initialPrice,
                availableSizes,
                availableColors,
                sizeGuide,
                printingType: design.printing_type,
                print_dimensions: design.print_dimensions,
                priceBreakdown,
                print_file_url: design.print_file_url,
            };

            const repriced = await repriceAll([newItem]);
            setCartItems(repriced);

        } catch (error) {
            console.error("Failed to init order:", error);
        } finally {
            setLoading(false);
        }
      }
    };
    
    initCart();
  }, [initialDesignId]);

  // Phase 1.5: Hydrate from Context if NOT "Buy Now" flow
  useEffect(() => {
     const hydrateCart = async () => {
         // Only hydrate if NOT buying single design directly AND we have context items but no local items yet
         if (!initialDesignId && contextCartItems.length > 0 && cartItems.length === 0) {
             console.log("Hydrating Cart from Context:", contextCartItems);
             setLoading(true);
             try {
                 const richItems = await Promise.all(contextCartItems.map(async (cItem) => {
                     // Fetch Product Logic (Duplicate of above but for each item)
                     const product = await getProductById(cItem.product_id as string);
                     const templates = await getProductTemplates(cItem.product_id as string).catch(() => []);
                     
                     // Size Guide
                     let sizeGuide = {};
                     if (typeof product.size_guide === 'string') {
                          try { sizeGuide = JSON.parse(product.size_guide) } catch(e) {}
                     } else {
                          sizeGuide = product.size_guide || {};
                     }
                     
                     // Available Sizes — from shirt_pricing (authoritative)
                     const availableSizes: string[] = product.available_sizes?.length
                         ? product.available_sizes
                         : ['S', 'M', 'L', 'XL', 'XXL'];
                     
                     let allProductColors = Array.from(new Map(
                         templates.map((t: any) => [t.color?.id, t.color])
                     ).values()).filter(Boolean);
                     
                     // Check if cItem has color constraint? 
                     // The CartItem in Context has 'color_id'.
                     // For Order UI, we want to show available colors. 
                     // Assuming all colors are available unless restricted by design (which we don't strictly have here unless we fetch the original design too).
                     // But wait, cItem.design_json is generic.
                     // The Design object might not be readily available if it's a "New" composition?
                     // Actually, cItem is created from a Template.
                     // Let's assume all product colors are available.
                     
                     const availableColors = allProductColors;

                     // Pricing via new pricing API
                     const colorId = cItem.color_id || availableColors[0]?.id || 'white';
                     let price = cItem.price || product.starting_price || 500;
                     let printingType: string | undefined;
                     let print_dimensions: Record<string, { w: number; h: number }> | undefined;
                     let priceBreakdown: ItemPriceBreakdown | undefined;

                     // Fetch design for print_dimensions if available
                     if (cItem.design_id && cItem.design_id !== 'custom') {
                         const design = await getDesignById(cItem.design_id).catch(() => null);
                         if (design) {
                             printingType = design.printing_type;
                             print_dimensions = design.print_dimensions;
                         }
                     }

                     if (print_dimensions && printingType) {
                         const bd = await calcMultiSidePrice(printingType, print_dimensions, cItem.quantity, String(product.id), colorId, cItem.size).catch(() => null);
                         if (bd) { priceBreakdown = bd; price = bd.total_per_unit; }
                     }

                     return {
                         id: cItem.id,
                         designId: cItem.design_id || "custom",
                         designName: cItem.design_name || "Custom Design",
                         designImage: cItem.preview_url || "https://via.placeholder.com/150",
                         productId: String(product.id),
                         productName: product.name,
                         size: cItem.size,
                         color: availableColors.find((c: any) => c.id === cItem.color_id)?.name || cItem.color_id,
                         color_id: colorId,
                         quantity: cItem.quantity,
                         price,
                         availableSizes,
                         availableColors,
                         sizeGuide,
                         printingType,
                         print_dimensions,
                         priceBreakdown,
                         print_file_url: cItem.print_file_url,
                     };
                 }));
                 
                 const repriced = await repriceAll(richItems);
                setCartItems(repriced);
             } catch (e) {
                 console.error("Failed to hydrate cart:", e);
             } finally {
                 setLoading(false);
             }
         }
     };
     hydrateCart();
  }, [contextCartItems, initialDesignId]); // Run when context changes or id changes


  const addToCart = async (design: any) => {
      // ... no changes to addToCart ...
      setAddingDesignId(design.id);
      try {
            // Fetch Product & Templates
            const [product, templates] = await Promise.all([
                getProductById(design.base_product_id),
                getProductTemplates(design.base_product_id).catch(() => [])
            ]);
            
            // Available Sizes — from shirt_pricing (authoritative)
            const availableSizes: string[] = product.available_sizes?.length
                ? product.available_sizes
                : ['S', 'M', 'L', 'XL', 'XXL'];

            // Keep size_guide for reference only (measurements display)
            let sizeGuide = {};
            if (typeof product.size_guide === 'string') {
                 try { sizeGuide = JSON.parse(product.size_guide) } catch(e) {}
            } else {
                 sizeGuide = product.size_guide || {};
            }
            
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

            // Initial Price via new pricing API
            const quantity = 1;
            const initialSize = availableSizes[0] || 'M';
            const initialColor = availableColors[0];
            const initialColorId = initialColor?.id || 'white';
            let initialPrice = product.starting_price || product.price || 500;
            let priceBreakdown: ItemPriceBreakdown | undefined;

            if (design.print_dimensions && design.printing_type) {
                const bd = await calcMultiSidePrice(design.printing_type, design.print_dimensions, quantity, String(design.base_product_id), initialColorId, initialSize).catch(() => null);
                if (bd) { priceBreakdown = bd; initialPrice = bd.total_per_unit; }
            }

            // Persist to CartContext/DB so it survives navigation
            const ctxId = ctxAddToCart({
                product_id: design.base_product_id,
                color_id: initialColorId,
                size: initialSize,
                quantity,
                design_id: design.id,
                print_file_url: design.print_file_url || '',
                design_json: {},
                preview_url: design.preview_image_url,
                design_name: design.design_name,
            });

            const newItem: CartItem = {
                id: ctxId,
                designId: design.id,
                designName: design.design_name,
                designImage: design.preview_image_url,
                productId: String(product.id),
                productName: product.name,
                size: initialSize,
                color: initialColor?.name || 'Default',
                color_id: initialColorId,
                quantity,
                price: initialPrice,
                availableSizes,
                availableColors,
                sizeGuide,
                printingType: design.printing_type,
                print_dimensions: design.print_dimensions,
                priceBreakdown,
                print_file_url: design.print_file_url,
            };

            const newItems = [...cartItems, newItem];
            const repriced = await repriceAll(newItems);
            setCartItems(repriced);

      } catch (error) {
          console.error("Failed to add item:", error);
      } finally {
          setAddingDesignId(null);
          setIsAddOpen(false); 
      }
  };

  const handleNext = () => {
      setStep(prev => Math.min(prev + 1, 3));
  };
  
  const handleBack = () => {
      setStep(prev => Math.max(prev - 1, 1));
  };

  const updateItem = async (id: string, field: keyof CartItem, value: any) => {
      // 1. Sync context update
      if (contextCartItems.some(i => i.id === id)) {
          if (field === 'quantity' || field === 'size' || field === 'color') {
              let updates: any = {};
              if (field === 'quantity') updates.quantity = value;
              if (field === 'size') updates.size = value;
              if (field === 'color') {
                  const currentItem = cartItems.find(i => i.id === id);
                  if (currentItem) {
                      const colorObj = currentItem.availableColors.find((c: any) => c.name === value);
                      if (colorObj) updates.color_id = colorObj.id;
                  }
              }
              if (Object.keys(updates).length > 0) updateCartItem(id, updates);
          }
      }

      // 2. Build updated items array (sync color_id when color name changes)
      if (field === 'quantity' || field === 'size' || field === 'color') {
          const updatedItems = cartItems.map(item => {
              if (item.id !== id) return item;
              const next = { ...item, [field]: value } as CartItem;
              if (field === 'color') {
                  const colorObj = item.availableColors.find((c: any) => c.name === value);
                  if (colorObj) next.color_id = colorObj.id;
              }
              return next;
          });
          setCartItems(updatedItems);

          if (field === 'quantity' || field === 'color') {
              // Group quantities changed → reprice all items (debounced for quantity)
              clearTimeout(repriceTimer.current);
              const snapshot = updatedItems;
              repriceTimer.current = setTimeout(async () => {
                  const repriced = await repriceAll(snapshot);
                  setCartItems(repriced);
              }, field === 'quantity' ? 400 : 0);
          } else {
              // Size change: group quantities unchanged → reprice only this item
              const item = updatedItems.find(i => i.id === id);
              if (item?.print_dimensions && item?.printingType) {
                  const shirtQty = updatedItems
                      .filter(i => i.productId === item.productId && i.color_id === item.color_id)
                      .reduce((s, i) => s + i.quantity, 0);
                  const printQty = updatedItems
                      .filter(i => i.designId === item.designId)
                      .reduce((s, i) => s + i.quantity, 0);
                  const bd = await calcMultiSidePrice(
                      item.printingType, item.print_dimensions, item.quantity,
                      item.productId, item.color_id, item.size, shirtQty, printQty
                  ).catch(() => null);
                  if (bd) {
                      setCartItems(prev => prev.map(i =>
                          i.id === id ? { ...i, price: bd.total_per_unit, priceBreakdown: bd } : i
                      ));
                  }
              }
          }
      }
  };

  const removeItem = (id: string) => {
      setCartItems(prev => prev.filter(i => i.id !== id));
      removeFromCart(id); // Sync context
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

        const result = await createOrder(orderPayload);

        clearCart();
        setPlacedOrderId(result.orderId);
        setStep(4);
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
      {step < 4 && <div className="flex items-center justify-center mb-8">
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
      </div>}

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
                                 {item.priceBreakdown ? (
                                     <div className="text-right space-y-0.5">
                                         <div className="flex justify-between gap-4 text-xs text-gray-400">
                                             <span>เสื้อ</span>
                                             <span>฿{item.priceBreakdown.shirt_per_unit.toLocaleString()}</span>
                                         </div>
                                         {item.priceBreakdown.sides.map(s => (
                                             <div key={s.side} className="flex justify-between gap-4 text-xs text-gray-400">
                                                 <span>พิมพ์ {s.side} ({s.tier})</span>
                                                 <span>฿{s.print_per_unit.toLocaleString()}</span>
                                             </div>
                                         ))}
                                         <div className="text-xs text-gray-500 font-medium border-t pt-0.5">฿{item.price.toLocaleString()} / ชิ้น</div>
                                     </div>
                                 ) : (
                                     <span className="text-xs text-gray-400">฿{item.price.toLocaleString()} / ชิ้น</span>
                                 )}
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
                         <Button variant="outline" className="border-border rounded-none font-bold uppercase tracking-widest hover:bg-secondary/80 text-foreground transition-all duration-300">
                             <Plus className="w-4 h-4 mr-2"/> ซื้อสินค้าเพิ่ม
                         </Button>
                     </SheetTrigger>
                     <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-background border-l border-border pt-12">
                         <SheetHeader className="mb-6">
                             <SheetTitle className="font-bold uppercase tracking-wider text-xl text-foreground flex items-center gap-2">
                                <Plus className="w-5 h-5 text-action" /> เลือกผลงานออกแบบของฉัน
                             </SheetTitle>
                         </SheetHeader>
                         <ScrollArea className="h-[calc(100vh-120px)] pr-6">
                             {loadingDesigns ? (
                                 <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground w-8 h-8"/></div>
                             ) : myDesigns.length === 0 ? (
                                 <div className="text-center p-12 border border-border bg-secondary/20 rounded-none mt-4">
                                     <p className="text-muted-foreground font-light">ยังไม่มีผลงานออกแบบ</p>
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-2 gap-6 pb-8">
                                     {myDesigns.map(design => (
                                         <div key={design.id} 
                                            className={`relative bg-secondary/20 border border-border p-4 cursor-pointer transition-all duration-300 group overflow-hidden ${
                                                addingDesignId === design.id 
                                                ? "opacity-70 pointer-events-none" 
                                                : "hover:border-primary/50 hover:bg-secondary/40 shadow-sm"
                                            }`}
                                            onClick={() => {
                                                if (addingDesignId !== design.id) {
                                                    addToCart(design);
                                                }
                                            }}
                                         >
                                             {/* Accent Bar */}
                                             <div className="absolute top-0 left-0 w-full h-1 bg-border group-hover:bg-primary/50 transition-colors duration-300" />

                                             {addingDesignId === design.id && (
                                                 <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 border border-primary">
                                                     <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                 </div>
                                             )}
                                             
                                             <div className="bg-secondary/50 border border-border p-2 mb-4 group-hover:border-primary/30 transition-colors">
                                                 <img src={design.preview_image_url || "https://via.placeholder.com/150"} alt={design.design_name} className="w-full aspect-square object-contain" />
                                             </div>
                                             
                                             <p className="font-bold uppercase tracking-widest text-xs text-center text-foreground truncate px-2">{design.design_name}</p>
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
                       <div key={item.id} className="space-y-0.5">
                           <div className="flex justify-between text-sm font-medium">
                               <span>{item.designName} ({item.size}, {item.color}) x {item.quantity}</span>
                               <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                           </div>
                           {item.priceBreakdown && (
                               <div className="pl-2 space-y-0.5">
                                   <div className="flex justify-between text-xs text-gray-400">
                                       <span>เสื้อ</span>
                                       <span>฿{item.priceBreakdown.shirt_per_unit.toLocaleString()} / ชิ้น</span>
                                   </div>
                                   {item.priceBreakdown.sides.map(s => (
                                       <div key={s.side} className="flex justify-between text-xs text-gray-400">
                                           <span>พิมพ์ {s.side} ({s.tier})</span>
                                           <span>฿{s.print_per_unit.toLocaleString()} / ชิ้น</span>
                                       </div>
                                   ))}
                               </div>
                           )}
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

      {step === 4 && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">สั่งซื้อสำเร็จแล้ว!</h2>
            <p className="text-gray-500 mt-1">กรุณาชำระเงินตามขั้นตอนด้านล่าง</p>
          </div>

          <div className="bg-gray-50 rounded-xl border p-4">
            <p className="text-sm text-gray-500 mb-1">หมายเลขคำสั่งซื้อ</p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono flex-1">#{placedOrderId}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(String(placedOrderId));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </Button>
            </div>
          </div>

          <div className="bg-white border rounded-xl divide-y overflow-hidden">
            <div className="p-4 space-y-3">
              <p className="font-semibold">1. เพิ่มเพื่อน LINE ของ PimSuea</p>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                {import.meta.env.VITE_LINE_QR_URL && (
                  <img
                    src={import.meta.env.VITE_LINE_QR_URL}
                    alt="LINE QR Code"
                    className="w-40 h-40 sm:w-48 sm:h-48 object-contain border rounded-lg"
                  />
                )}
                <div>
                  <p className="text-sm text-gray-500">หรือค้นหา LINE ID:</p>
                  <p className="text-lg font-bold text-green-600">{import.meta.env.VITE_LINE_ID || '@PimSuea'}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="font-semibold">2. ส่งหมายเลขคำสั่งซื้อในแชท LINE</p>
              <p className="text-sm text-gray-500 mt-1">
                ส่ง <span className="font-mono font-bold text-gray-800">#{placedOrderId}</span> ให้เราทราบในแชท LINE
              </p>
            </div>

            <div className="p-4 space-y-3">
              <p className="font-semibold">3. ชำระเงินผ่าน PromptPay</p>
              <p className="text-sm text-gray-500">
                ยอดชำระ: <span className="font-bold text-gray-800 text-base">฿{totalPrice.toLocaleString()}</span>
              </p>
              {import.meta.env.VITE_PROMPTPAY_QR_URL && (
                <img
                  src={import.meta.env.VITE_PROMPTPAY_QR_URL}
                  alt="PromptPay QR Code"
                  className="w-64 h-64 sm:w-80 sm:h-80 object-contain mx-auto border rounded-xl"
                />
              )}
            </div>
          </div>

          <Link to="/orders">
            <Button className="w-full" size="lg">
              ดูคำสั่งซื้อของฉัน <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {step < 4 && (
        <div className="mt-8 flex justify-between">
            {step > 1 ? (
                <Button variant="outline" onClick={handleBack}>ย้อนกลับ</Button>
            ) : null}

            {step < 3 ? (
                <Button onClick={handleNext} disabled={cartItems.length === 0}>
                    ดำเนินการต่อ <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            ) : (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    ยืนยันการสั่งซื้อ
                </Button>
            )}
        </div>
      )}
    </div>
  );
}
