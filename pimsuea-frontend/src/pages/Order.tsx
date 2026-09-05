import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getDesignById, getProductById, createCheckoutSession, getMyDesigns, getProductTemplates, getPrice, fetchDeliveryFee, fetchAddons } from "@/services/api";
import CouponInput, { type AppliedCoupon, type CouponItem, computeDiscount } from "@/components/CouponInput";
import { isLegacyDtfPrintingType } from "@/constants/printing";
import { dtfDiscontinuedMessage } from "@/translations/app/checkout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ShoppingCart, Truck, ChevronRight, Check, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckoutReprintGuarantee } from "@/components/CheckoutReprintGuarantee";
import { TermsModal, REPRINT_GUARANTEE_SECTION_ID } from "@/components/TermsModal";
import { GiftServiceLineOption } from "@/components/checkout/GiftServiceLineOption";
import type { GiftRecipientInfo, AddonPricing } from "@/types/gift";
import { EMPTY_GIFT_RECIPIENT, GIFT_SERVICE_CODE } from "@/types/gift";
import {
  filterAddressInput,
  validateAddressField,
  firstAddressError,
} from "@/lib/addressValidation";
import { parsePreviewUrls, resolvePreviewDisplayUrl, getPreviewDisplayUrl } from "@/lib/previews";
import { getProductName } from "@/lib/productName";

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
  previewUrls?: Record<string, string>; // color_id → preview URL
  productId: string;
  productName: string;
  productNameEn?: string | null;
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
  is_gift?: boolean;
  gift_message?: string;
  gift_recipient?: GiftRecipientInfo;
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
  const { lang, t } = useLanguage();
  const c = t.checkout;
  const common = t.common;
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
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsSection, setTermsSection] = useState<string | undefined>();

  const openReprintPolicy = () => {
    setTermsSection(REPRINT_GUARANTEE_SECTION_ID);
    setTermsOpen(true);
  };

  const closeTerms = () => {
    setTermsOpen(false);
    setTermsSection(undefined);
  };

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
  const { cartItems: contextCartItems, addToCart: ctxAddToCart, removeFromCart, updateCartItem } = useCart();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '', phone: '', addressLine1: '', addressLine2: '', province: '', district: '', postalCode: ''
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof ShippingInfo>>(new Set());
  const [giftValidateKeys, setGiftValidateKeys] = useState<Record<string, number>>({});

  // Delivery fee state
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryLabel, setDeliveryLabel] = useState('');

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Gift Service add-on pricing (from Supabase, not hardcoded)
  const [giftAddon, setGiftAddon] = useState<AddonPricing | null>(null);

  useEffect(() => {
    fetchAddons()
      .then((addons) => {
        const found = addons.find((a) => a.code === GIFT_SERVICE_CODE) ?? null;
        setGiftAddon(found);
      })
      .catch(() => setGiftAddon(null));
  }, []);

  // Calculate Total
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const nonGiftQty = cartItems.filter((item) => !item.is_gift).reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const giftLineCount = cartItems.filter((item) => item.is_gift).length;
  const addonFeesTotal = giftAddon ? giftLineCount * giftAddon.price_thb : 0;
  const hasDtfItems = cartItems.some(item => isLegacyDtfPrintingType(item.printingType));
  const grandTotal = totalPrice + addonFeesTotal - discountAmount + deliveryFee;

  // Fetch delivery fee whenever non-gift cart quantity changes
  useEffect(() => {
    if (nonGiftQty < 1) {
      setDeliveryFee(0);
      setDeliveryLabel(nonGiftQty === 0 && giftLineCount > 0 ? c.includedInGift : '');
      return;
    }
    fetchDeliveryFee(nonGiftQty).then(({ fee, label }) => {
      setDeliveryFee(fee);
      setDeliveryLabel(label);
    }).catch(() => { /* keep previous fee on error */ });
  }, [nonGiftQty, giftLineCount]);

  // Recompute discount preview whenever cart changes
  useEffect(() => {
    if (appliedCoupon) {
      const types = appliedCoupon.allowed_printing_types;
      const relevant: CouponItem[] = cartItems
        .filter(i => !types?.length || (i.printingType && types.map(t => t.toLowerCase()).includes(i.printingType.toLowerCase())))
        .map(i => ({ printingType: i.printingType, price: i.price, quantity: i.quantity }));
      const filteredSubtotal = relevant.reduce((s, i) => s + i.price * i.quantity, 0);
      const filteredQty = relevant.reduce((s, i) => s + i.quantity, 0);
      setDiscountAmount(computeDiscount(appliedCoupon, filteredSubtotal, filteredQty));
    }
  }, [appliedCoupon, cartItems]);

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
            const availableSizes: string[] = product.available_sizes ?? [];

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
            const initialSize = availableSizes[0] ?? '';
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

            const previewUrls = parsePreviewUrls(design.preview_image_url);
            const newItem: CartItem = {
                id: ctxId,
                designId: design.id,
                designName: design.design_name,
                designImage: resolvePreviewDisplayUrl(previewUrls, initialColorId, design.preview_image_url),
                previewUrls,
                productId: String(product.id),
                productName: product.name,
                productNameEn: product.name_en,
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

  // Phase 1.5: Hydrate from Context if NOT "Buy Now" flow
  useEffect(() => {
     const hydrateCart = async () => {
         // Only hydrate if NOT buying single design directly AND we have context items but no local items yet
         if (!initialDesignId && contextCartItems.length > 0 && cartItems.length === 0) {
             console.log("Hydrating Cart from Context:", contextCartItems);
             setLoading(true);
             try {
                 const richItems = await Promise.all(contextCartItems.map(async (cItem) => {
                     // Fetch product, templates, and design all in parallel
                     const [product, templates, design] = await Promise.all([
                         getProductById(cItem.product_id as string),
                         getProductTemplates(cItem.product_id as string).catch(() => []),
                         (cItem.design_id && cItem.design_id !== 'custom')
                             ? getDesignById(cItem.design_id).catch(() => null)
                             : Promise.resolve(null),
                     ]);

                     // Size Guide
                     let sizeGuide = {};
                     if (typeof product.size_guide === 'string') {
                          try { sizeGuide = JSON.parse(product.size_guide) } catch(e) {}
                     } else {
                          sizeGuide = product.size_guide || {};
                     }

                     // Available Sizes — from shirt_pricing (authoritative)
                     const availableSizes: string[] = product.available_sizes ?? [];

                     const availableColors = Array.from(new Map(
                         templates.map((t: any) => [t.color?.id, t.color])
                     ).values()).filter(Boolean);

                     const colorId = cItem.color_id || availableColors[0]?.id || 'white';
                     const price = cItem.price || product.starting_price || 500;
                     const printingType: string | undefined = design?.printing_type;
                     const print_dimensions: Record<string, { w: number; h: number }> | undefined = design?.print_dimensions;
                     // repriceAll below will compute the correct group-quantity price
                     const priceBreakdown: ItemPriceBreakdown | undefined = undefined;

                     const previewUrls = parsePreviewUrls(design?.preview_image_url);
                     return {
                         id: cItem.id,
                         designId: cItem.design_id || "custom",
                         designName: cItem.design_name || "Custom Design",
                         designImage: resolvePreviewDisplayUrl(previewUrls, colorId, cItem.preview_url || ''),
                         previewUrls,
                         productId: String(product.id),
                         productName: product.name,
                         productNameEn: product.name_en,
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
                         is_gift: cItem.is_gift ?? false,
                         gift_message: cItem.gift_message ?? '',
                         gift_recipient: cItem.gift_recipient ?? { ...EMPTY_GIFT_RECIPIENT },
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
            const availableSizes: string[] = product.available_sizes ?? [];

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
            const initialSize = availableSizes[0] ?? '';
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

            const previewUrls = parsePreviewUrls(design.preview_image_url);
            const newItem: CartItem = {
                id: ctxId,
                designId: design.id,
                designName: design.design_name,
                designImage: resolvePreviewDisplayUrl(previewUrls, initialColorId, design.preview_image_url),
                previewUrls,
                productId: String(product.id),
                productName: product.name,
                productNameEn: product.name_en,
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

  const validateShippingField = (field: keyof ShippingInfo, value: string): string | undefined => {
      if (field === 'addressLine2') return undefined;
      return validateAddressField(field, value);
  };

  const updateGiftFields = (
      id: string,
      updates: Partial<Pick<CartItem, 'is_gift' | 'gift_message' | 'gift_recipient'>>,
  ) => {
      setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      if (contextCartItems.some((i) => i.id === id)) {
          updateCartItem(id, updates);
      }
  };

  const filterShippingInput = (field: keyof ShippingInfo, value: string): string =>
      filterAddressInput(field, value);

  const handleShippingChange = (field: keyof ShippingInfo, value: string) => {
      const filtered = filterShippingInput(field, value);
      setShippingInfo(prev => ({ ...prev, [field]: filtered }));
      if (touchedFields.has(field)) {
          setShippingErrors(prev => ({ ...prev, [field]: validateShippingField(field, filtered) }));
      }
  };

  const handleShippingBlur = (field: keyof ShippingInfo) => {
      setTouchedFields(prev => new Set([...prev, field]));
      setShippingErrors(prev => ({ ...prev, [field]: validateShippingField(field, shippingInfo[field]) }));
  };

  const handleNext = () => {
      if (hasDtfItems) {
          setNotification({
              type: 'error',
              title: c.cannotProceed,
              message: dtfDiscontinuedMessage(lang),
          });
          return;
      }
      if (step === 1) {
          if (giftLineCount > 0 && !giftAddon) {
              setNotification({
                  type: 'error',
                  title: c.giftUnavailable,
                  message: c.giftUnavailableDesc,
              });
              return;
          }
          for (const item of cartItems) {
              if (!item.is_gift) continue;
              const err = firstAddressError(item.gift_recipient);
              if (err) {
                  setGiftValidateKeys((prev) => ({
                      ...prev,
                      [item.id]: (prev[item.id] ?? 0) + 1,
                  }));
                  setNotification({ type: 'error', title: c.giftIncomplete, message: `${item.designName}: ${err}` });
                  return;
              }
          }
      }
      if (step === 2) {
          const fields: (keyof ShippingInfo)[] = ['fullName', 'phone', 'province', 'district', 'postalCode', 'addressLine1'];
          setTouchedFields(new Set(fields));
          const errors: Partial<Record<keyof ShippingInfo, string>> = {};
          for (const f of fields) {
              const err = validateShippingField(f, shippingInfo[f]);
              if (err) errors[f] = err;
          }
          setShippingErrors(errors);
          if (Object.keys(errors).length > 0) return;
      }
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
                  if (colorObj) {
                      next.color_id = colorObj.id;
                      next.designImage = resolvePreviewDisplayUrl(item.previewUrls, colorObj.id);
                  }
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
      if (hasDtfItems) {
          setNotification({
              type: 'error',
              title: c.cannotOrder,
              message: dtfDiscontinuedMessage(lang),
          });
          return;
      }
      setLoading(true);
      setNotification(null);
      try {
        const orderPayload = {
            items: cartItems.map(item => ({
                ...item,
                is_gift: item.is_gift ?? false,
                gift_message: item.gift_message ?? '',
                gift_recipient: item.is_gift ? item.gift_recipient : null,
            })),
            shipping: shippingInfo,
            coupon_code: appliedCoupon?.code ?? null,
        };

        const { url } = await createCheckoutSession(orderPayload);
        window.location.href = url;
      } catch (error: unknown) {
          console.error("Checkout session failed:", error);
          const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
              || c.paymentError;
          setNotification({
             type: 'error',
             title: common.error,
             message,
          });
          setLoading(false);
      }
  };

  if (loading && cartItems.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Alert Notification */}
      {notification && (
        <div className="fixed top-safe-offset right-4 pr-safe z-100 w-full max-w-md animate-in fade-in slide-in-from-top-2">
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
      <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current shrink-0">1</div>
              <span className="hidden sm:inline text-sm">{c.cart}</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-gray-200 mx-2 sm:mx-4 shrink-0" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current shrink-0">2</div>
              <span className="hidden sm:inline text-sm">{c.shipping}</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-gray-200 mx-2 sm:mx-4 shrink-0" />
           <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current shrink-0">3</div>
              <span className="hidden sm:inline text-sm">{c.summary}</span>
          </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center"><ShoppingCart className="mr-2" /> {c.cartTitle}</h2>

            {hasDtfItems && (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">{c.dtfBlocked}</AlertTitle>
                    <AlertDescription>{dtfDiscontinuedMessage(lang)}</AlertDescription>
                </Alert>
            )}
            
             {cartItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <p className="text-gray-500 mb-4">{c.cartEmpty}</p>
                    <Button onClick={() => navigate('/my-products')}>{c.pickDesign}</Button>
                </div>
             ) : (
                 <div className="space-y-4">
                     {cartItems.map((item) => (
                         <div key={item.id} className="bg-white border rounded-xl p-4 flex flex-col gap-4">
                             <div className="flex flex-col md:flex-row gap-4 md:items-start w-full">
                             <div className="flex gap-4 items-start">
                             <img src={item.designImage} alt={item.designName} className="w-20 h-20 md:w-24 md:h-24 object-contain bg-gray-50 rounded-md border shrink-0" />
                             <div className="flex-1 min-w-0">
                                     <h3 className="font-semibold">{item.designName}</h3>
                                     <p className="text-sm text-gray-500">
                                         {getProductName(
                                             { name: item.productName, name_en: item.productNameEn },
                                             lang,
                                         )}
                                     </p>
                                 </div>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                                     <div>
                                         <Label className="text-xs">Size</Label>
                                         <select 
                                            className="w-full border rounded-md p-2.5 text-sm bg-gray-50 bg-opacity-30 min-h-11" 
                                            value={item.size}
                                            onChange={(e) => updateItem(item.id, 'size', e.target.value)}
                                         >
                                             {item.availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <Label className="text-xs">Color</Label>
                                          <select 
                                            className="w-full border rounded-md p-2.5 text-sm bg-gray-50 bg-opacity-30 min-h-11" 
                                            value={item.color}
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
                                            className="h-11"
                                         />
                                     </div>
                             </div>
                             <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 w-full md:w-auto">
                                 <div className="text-left md:text-right">
                                 <span className="font-bold text-lg block">฿{(item.price * item.quantity).toLocaleString()}</span>
                                 {item.priceBreakdown ? (
                                     <div className="text-left md:text-right space-y-0.5">
                                         <div className="flex justify-between gap-4 text-xs text-gray-400">
                                             <span>{c.shirt}</span>
                                             <span>฿{item.priceBreakdown.shirt_per_unit.toLocaleString()}</span>
                                         </div>
                                         {item.priceBreakdown.sides.map(s => (
                                             <div key={s.side} className="flex justify-between gap-4 text-xs text-gray-400">
                                                 <span>{c.print} {s.side} ({s.tier})</span>
                                                 <span>฿{s.print_per_unit.toLocaleString()}</span>
                                             </div>
                                         ))}
                                         <div className="text-xs text-gray-500 font-medium border-t pt-0.5">฿{item.price.toLocaleString()} {common.perPiece}</div>
                                     </div>
                                 ) : (
                                     <span className="text-xs text-gray-400">฿{item.price.toLocaleString()} {common.perPiece}</span>
                                 )}
                                 </div>
                                 <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-11 w-11 shrink-0" onClick={() => removeItem(item.id)}>
                                     <Trash2 className="w-4 h-4" />
                                 </Button>
                             </div>
                             </div>
                              <div className="w-full">
                                <GiftServiceLineOption
                                 enabled={Boolean(item.is_gift)}
                                 onEnabledChange={(enabled) => updateGiftFields(item.id, {
                                     is_gift: enabled,
                                     gift_recipient: enabled ? (item.gift_recipient ?? { ...EMPTY_GIFT_RECIPIENT }) : item.gift_recipient,
                                 })}
                                 message={item.gift_message ?? ''}
                                 onMessageChange={(gift_message) => updateGiftFields(item.id, { gift_message })}
                                 recipient={item.gift_recipient ?? EMPTY_GIFT_RECIPIENT}
                                 onRecipientChange={(gift_recipient) => updateGiftFields(item.id, { gift_recipient })}
                                 addonPrice={giftAddon?.price_thb ?? null}
                                 addonAvailable={Boolean(giftAddon)}
                                 addonName={giftAddon?.name}
                                 validateKey={giftValidateKeys[item.id] ?? 0}
                             />
                             </div>
                         </div>
                     ))}
                 </div>
             )}

             <div className="flex justify-between pt-4 border-t mt-4">
                 <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                     <SheetTrigger asChild>
                         <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-300">
                             <Plus className="w-5 h-5 mr-2"/> {c.addMore}
                         </Button>
                     </SheetTrigger>
                     <SheetContent side="right" className="w-[85vw] sm:w-100 md:w-135 bg-gray-50 border-l border-gray-100 pt-12 shadow-2xl">
                         <SheetHeader className="mb-6 px-2">
                             <SheetTitle className="font-bold text-2xl text-gray-900 flex items-center gap-3">
                                <span className="bg-primary/10 p-2 rounded-xl text-primary"><Plus className="w-5 h-5" /></span>
                                {c.pickDesign}
                             </SheetTitle>
                         </SheetHeader>
                         <ScrollArea className="h-[calc(100vh-120px)] px-2 pb-6">
                             {loadingDesigns ? (
                                 <div className="flex justify-center py-20 px-4"><Loader2 className="animate-spin text-primary w-8 h-8"/></div>
                             ) : myDesigns.length === 0 ? (
                                 <div className="text-center p-12 bg-white border border-dashed border-gray-200 rounded-3xl mt-4">
                                     <p className="text-gray-500 font-medium">{c.noDesigns}</p>
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-2 gap-4 pb-8">
                                     {myDesigns.map(design => (
                                         <div key={design.id} 
                                            className={`relative bg-white border border-gray-100 p-3 rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden ${
                                                addingDesignId === design.id 
                                                ? "opacity-70 pointer-events-none scale-[0.98]" 
                                                : "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                                            }`}
                                            onClick={() => {
                                                if (addingDesignId !== design.id) {
                                                    addToCart(design);
                                                }
                                            }}
                                         >
                                             {addingDesignId === design.id && (
                                                 <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                                                     <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                                                         <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                     </div>
                                                 </div>
                                             )}
                                             
                                             <div className="bg-gray-50 rounded-xl mb-3 overflow-hidden aspect-square flex items-center justify-center">
                                                 <img src={getPreviewDisplayUrl(design.preview_image_url) || "https://via.placeholder.com/150"} alt={design.design_name} className="w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                                             </div>
                                             
                                             <div className="px-1 text-center">
                                                <p className="font-bold text-sm text-gray-900 truncate">{design.design_name}</p>
                                                <div className="inline-flex items-center text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                                    <Plus className="w-3 h-3 mr-1" /> {c.addToCartDesign}
                                                </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </ScrollArea>
                     </SheetContent>
                 </Sheet>

                 <div className="text-right">
                     <p className="text-gray-500">{c.totalAll} ({totalItems} {common.pieces})</p>
                     <p className="text-3xl font-bold text-primary">฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                     {addonFeesTotal > 0 && (
                         <p className="text-xs text-gray-400">{c.giftServiceTotal} +฿{addonFeesTotal.toLocaleString()}</p>
                     )}
                 </div>
             </div>
        </div>
      )}

      {step === 2 && (
          <div className="space-y-6 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold flex items-center"><Truck className="mr-2" /> {c.shippingStepTitle}</h2>
              <p className="text-sm text-muted-foreground">{c.shippingStepDesc}</p>
              <div className="grid grid-cols-1 gap-4">
                  <div>
                      <Label>{c.recipientName} <span className="text-red-500">*</span></Label>
                      <Input
                          value={shippingInfo.fullName}
                          onChange={(e) => handleShippingChange('fullName', e.target.value)}
                          onBlur={() => handleShippingBlur('fullName')}
                          className={shippingErrors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {shippingErrors.fullName && <p className="text-red-500 text-xs mt-1">{shippingErrors.fullName}</p>}
                  </div>
                  <div>
                      <Label>{c.recipientPhone} <span className="text-red-500">*</span></Label>
                      <Input
                          value={shippingInfo.phone}
                          onChange={(e) => handleShippingChange('phone', e.target.value)}
                          onBlur={() => handleShippingBlur('phone')}
                          className={shippingErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                          inputMode="tel"
                      />
                      {shippingErrors.phone && <p className="text-red-500 text-xs mt-1">{shippingErrors.phone}</p>}
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                             <Label>{c.recipientProvince} <span className="text-red-500">*</span></Label>
                             <Input
                                 value={shippingInfo.province}
                                 onChange={(e) => handleShippingChange('province', e.target.value)}
                                 onBlur={() => handleShippingBlur('province')}
                                 className={shippingErrors.province ? 'border-red-500 focus-visible:ring-red-500' : ''}
                             />
                             {shippingErrors.province && <p className="text-red-500 text-xs mt-1">{shippingErrors.province}</p>}
                        </div>
                        <div>
                             <Label>{c.recipientDistrict} <span className="text-red-500">*</span></Label>
                             <Input
                                 value={shippingInfo.district}
                                 onChange={(e) => handleShippingChange('district', e.target.value)}
                                 onBlur={() => handleShippingBlur('district')}
                                 className={shippingErrors.district ? 'border-red-500 focus-visible:ring-red-500' : ''}
                             />
                             {shippingErrors.district && <p className="text-red-500 text-xs mt-1">{shippingErrors.district}</p>}
                        </div>
                   </div>
                   <div>
                         <Label>{c.recipientPostal} <span className="text-red-500">*</span></Label>
                         <Input
                             value={shippingInfo.postalCode}
                             onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                             onBlur={() => handleShippingBlur('postalCode')}
                             className={shippingErrors.postalCode ? 'border-red-500 focus-visible:ring-red-500' : ''}
                             inputMode="numeric"
                         />
                         {shippingErrors.postalCode && <p className="text-red-500 text-xs mt-1">{shippingErrors.postalCode}</p>}
                   </div>
                   <div>
                       <Label>{c.recipientAddress} <span className="text-red-500">*</span></Label>
                       <Input
                           value={shippingInfo.addressLine1}
                           onChange={(e) => handleShippingChange('addressLine1', e.target.value)}
                           onBlur={() => handleShippingBlur('addressLine1')}
                           className={shippingErrors.addressLine1 ? 'border-red-500 focus-visible:ring-red-500' : ''}
                       />
                       {shippingErrors.addressLine1 && <p className="text-red-500 text-xs mt-1">{shippingErrors.addressLine1}</p>}
                   </div>
              </div>
          </div>
      )}

      {step === 3 && (
          <div className="space-y-6">
               <h2 className="text-2xl font-bold flex items-center"><Check className="mr-2" /> {c.reviewOrder}</h2>
               <div className="bg-gray-50 p-6 rounded-xl border space-y-4">
                   <h3 className="font-semibold border-b pb-2">{c.orderSummary}</h3>
                   {cartItems.map(item => (
                       <div key={item.id} className="space-y-0.5">
                           <div className="flex justify-between text-sm font-medium">
                               <span>
                                   {item.designName} ({item.size}, {item.color}) x {item.quantity}
                                   {item.is_gift && <span className="ml-1 text-primary text-xs font-bold">🎁 {c.giftBadge}</span>}
                               </span>
                               <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                           </div>
                           {item.is_gift && giftAddon && (
                               <div className="flex justify-between text-xs text-primary pl-2">
                                   <span>{giftAddon.name}</span>
                                   <span>+฿{giftAddon.price_thb.toLocaleString()}</span>
                               </div>
                           )}
                           {item.is_gift && item.gift_recipient?.fullName && (
                               <p className="text-xs text-gray-500 pl-2">{c.sendTo}: {item.gift_recipient.fullName}</p>
                           )}
                           {item.priceBreakdown && (
                               <div className="pl-2 space-y-0.5">
                                   <div className="flex justify-between text-xs text-gray-400">
                                       <span>{c.shirt}</span>
                                       <span>฿{item.priceBreakdown.shirt_per_unit.toLocaleString()} {common.perPiece}</span>
                                   </div>
                                   {item.priceBreakdown.sides.map(sideRow => (
                                       <div key={sideRow.side} className="flex justify-between text-xs text-gray-400">
                                           <span>{c.print} {sideRow.side} ({sideRow.tier})</span>
                                           <span>฿{sideRow.print_per_unit.toLocaleString()} {common.perPiece}</span>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   ))}
                       <div className="pt-2 border-t">
                       <CouponInput
                           items={cartItems.map(i => ({ printingType: i.printingType, price: i.price, quantity: i.quantity }))}
                           appliedCoupon={appliedCoupon}
                           onApply={(coupon, discount) => { setAppliedCoupon(coupon); setDiscountAmount(discount); }}
                           onClear={() => { setAppliedCoupon(null); setDiscountAmount(0); }}
                       />
                   </div>
                   <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                       <span>{c.productSubtotal}</span>
                       <span>฿{totalPrice.toLocaleString()}</span>
                   </div>
                   {addonFeesTotal > 0 && (
                       <div className="flex justify-between text-sm text-gray-600">
                           <span>{c.giftServiceLines} ({giftLineCount} {c.itemsCount})</span>
                           <span>+฿{addonFeesTotal.toLocaleString()}</span>
                       </div>
                   )}
                   {discountAmount > 0 && (
                       <div className="flex justify-between text-sm text-green-600">
                           <span>{c.discountLabel} ({appliedCoupon?.code})</span>
                           <span>-฿{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                       </div>
                   )}
                   <div className="flex justify-between text-sm text-gray-600">
                       <span>{c.shippingFee}{deliveryLabel ? ` (${deliveryLabel})` : ''}</span>
                       <span>{deliveryFee === 0 ? c.free : `฿${deliveryFee.toLocaleString()}`}</span>
                   </div>
                   <div className="flex justify-between font-bold text-lg pt-2 border-t">
                       <span>{c.netTotal}</span>
                       <span>฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                   </div>
               </div>
               
               <div className="bg-gray-50 p-6 rounded-xl border">
                    <h3 className="font-semibold border-b pb-2 mb-2">{c.shippingAddressTitle}</h3>
                    <p>{shippingInfo.fullName} ({shippingInfo.phone})</p>
                    <p>{shippingInfo.addressLine1} {shippingInfo.province} {shippingInfo.postalCode}</p>
               </div>

               <div className="bg-gray-50 p-6 rounded-xl border space-y-4">
                    <h3 className="font-semibold border-b pb-2">{c.previewSectionTitle}</h3>
                    <p className="text-sm text-muted-foreground font-light">
                      {c.previewSectionDesc}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {cartItems.map(item => (
                        <div key={item.id} className="text-center space-y-1.5">
                          <img
                            src={item.designImage}
                            alt={item.designName}
                            className="w-24 h-24 object-contain bg-white rounded-md border"
                          />
                          <p className="text-xs text-muted-foreground max-w-24 truncate">{item.designName}</p>
                        </div>
                      ))}
                    </div>
                    <CheckoutReprintGuarantee onPolicyClick={openReprintPolicy} locale={lang} />
               </div>
          </div>
      )}

      <div className="sticky bottom-0 z-20 -mx-4 px-4 py-4 mt-8 flex justify-between gap-3 bg-slate-50/95 backdrop-blur-sm border-t border-gray-200 pb-safe">
            {step > 1 ? (
                <Button variant="outline" onClick={handleBack} className="min-h-11">{common.back}</Button>
            ) : <div />}

            {step < 3 ? (
                <Button onClick={handleNext} disabled={cartItems.length === 0 || hasDtfItems} className="min-h-11">
                    {common.continue} <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            ) : (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 min-h-11" disabled={loading || hasDtfItems}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {c.pay}
                </Button>
            )}
        </div>

      <TermsModal
        open={termsOpen}
        onClose={closeTerms}
        initialExpandedSection={termsSection}
        lang={lang}
      />
    </div>
  );
}
