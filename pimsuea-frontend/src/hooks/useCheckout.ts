import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getDesignById, getProductById, createCheckoutSession, getMyDesigns, getProductTemplates, fetchDeliveryFee, fetchAddons, validateCoupon } from "@/services/api";
import { type AppliedCoupon, type CouponItem, computeDiscount } from "@/components/CouponInput";
import { isLegacyDtfPrintingType } from "@/constants/printing";
import { dtfDiscontinuedMessage } from "@/translations/app/checkout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { trackMeta } from "@/lib/analytics";
import { readPendingPromoCode } from "@/lib/promoCode";
import { REPRINT_GUARANTEE_SECTION_ID } from "@/components/TermsModal";
import type { AddonPricing } from "@/types/gift";
import { EMPTY_GIFT_RECIPIENT, GIFT_SERVICE_CODE } from "@/types/gift";
import { filterAddressInput,
  validateAddressField,
  firstAddressError,
} from "@/lib/addressValidation";
import { parsePreviewUrls, resolvePreviewDisplayUrl } from "@/lib/previews";
import { getAttribution } from "@/lib/attribution";
import { toast } from "sonner";
import { readCheckoutSession, writeCheckoutSession, loadDefaultShipping, saveDefaultShipping } from "@/lib/checkoutSession";
import { calcMultiSidePrice, repriceAll, type CartItem, type ShippingInfo, type ItemPriceBreakdown } from "@/lib/checkoutCart";
/** All checkout state, effects and actions (cart → shipping → summary → Stripe). */

export function useCheckout() {
  const { lang, t } = useLanguage();
  const c = t.checkout;
  const common = t.common;
  // Router
  const [searchParams] = useSearchParams();
  const initialDesignId = searchParams.get('initialDesignId');
  const navigate = useNavigate();

  // Step State
  const persisted = readCheckoutSession();
  const [step, setStep] = useState(persisted?.step ?? 1);
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

  // Success messages auto-hide; errors stay until the user dismisses them.
  useEffect(() => {
    if (notification?.type !== 'success') return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);
  const dismissNotification = () => setNotification(null);

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
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(persisted?.shipping ?? {
    fullName: '', phone: '', addressLine1: '', addressLine2: '', province: '', district: '', postalCode: ''
  });
  const [usingSavedAddress, setUsingSavedAddress] = useState(false);

  // Remember where the user is (Stripe "back" returns to /checkout with a fresh page).
  useEffect(() => { writeCheckoutSession({ step, shipping: shippingInfo }); }, [step, shippingInfo]);

  // Pre-fill the last used address once (only if nothing was typed yet).
  useEffect(() => {
    if (persisted?.shipping?.fullName) return;
    let cancelled = false;
    loadDefaultShipping().then((saved) => {
      if (cancelled || !saved) return;
      setShippingInfo((prev) => (prev.fullName ? prev : { ...prev, ...saved }));
      setUsingSavedAddress(true);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, []);
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof ShippingInfo>>(new Set());
  const [giftValidateKeys, setGiftValidateKeys] = useState<Record<string, number>>({});

  // Delivery fee state
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryLabel, setDeliveryLabel] = useState('');

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const promoAutoApplied = useRef(false);

  useEffect(() => {
    if (promoAutoApplied.current) return;
    const code = readPendingPromoCode();
    if (!code) return;
    promoAutoApplied.current = true;
    let cancelled = false;
    validateCoupon(code)
      .then((result) => {
        if (cancelled || !result.valid || !result.code) return;
        setAppliedCoupon({
          code: result.code,
          discount_type: result.discount_type!,
          discount_value: result.discount_value!,
          max_discount_thb: result.max_discount_thb ?? null,
          max_qty: result.max_qty ?? null,
          allowed_printing_types: result.allowed_printing_types ?? null,
        });
      })
      .catch(() => { /* user can still type the code */ });
    return () => {
      cancelled = true;
    };
  }, []);

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
      return validateAddressField(field, value, lang);
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

  /** Re-create a cart line in the cart context (new id) and return the local item with that id. */
  const persistLine = (item: CartItem): CartItem => {
      const id = ctxAddToCart({
          product_id: item.productId,
          color_id: item.color_id,
          size: item.size,
          quantity: item.quantity,
          design_id: item.designId,
          print_file_url: item.print_file_url || '',
          design_json: {},
          preview_url: item.designImage,
          design_name: item.designName,
          is_gift: item.is_gift,
          gift_message: item.gift_message ?? null,
          gift_recipient: item.gift_recipient ?? null,
      });
      return { ...item, id };
  };

  const removeItem = (id: string) => {
      const index = cartItems.findIndex(i => i.id === id);
      const removed = cartItems[index];
      setCartItems(prev => prev.filter(i => i.id !== id));
      removeFromCart(id); // Sync context
      if (!removed) return;
      toast(t.ordering.removed, {
          action: {
              label: t.ordering.undo,
              onClick: () => {
                  const restored = persistLine(removed);
                  setCartItems(prev => {
                      const next = [...prev];
                      next.splice(Math.min(index, next.length), 0, restored);
                      void repriceAll(next).then(setCartItems);
                      return next;
                  });
              },
          },
      });
  };

  /** "+ Add size" on a design group: same design + colour, first unused size, qty 1. */
  const addSizeLine = (sourceId: string) => {
      const source = cartItems.find(i => i.id === sourceId);
      if (!source) return;
      const used = new Set(cartItems.filter(i => i.designId === source.designId && i.color_id === source.color_id).map(i => i.size));
      const size = source.availableSizes.find(s => !used.has(s));
      if (!size) return;
      const line = persistLine({ ...source, size, quantity: 1, is_gift: false, gift_message: '', gift_recipient: undefined });
      const next = [...cartItems, line];
      setCartItems(next);
      void repriceAll(next).then(setCartItems);
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
            attribution: getAttribution(),
            locale: lang,
        };

        const { url } = await createCheckoutSession(orderPayload);
        void saveDefaultShipping(shippingInfo, lang);
        trackMeta('InitiateCheckout', {
            currency: 'THB',
            value: grandTotal,
            num_items: cartItems.reduce((n, item) => n + item.quantity, 0),
        });
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


  return {
    dismissNotification, usingSavedAddress, addSizeLine,
    lang,
    t,
    c,
    common,
    initialDesignId,
    navigate,
    step,
    setStep,
    loading,
    setLoading,
    addingDesignId,
    setAddingDesignId,
    repriceTimer,
    isAddOpen,
    setIsAddOpen,
    myDesigns,
    setMyDesigns,
    loadingDesigns,
    setLoadingDesigns,
    notification,
    setNotification,
    termsOpen,
    setTermsOpen,
    termsSection,
    setTermsSection,
    openReprintPolicy,
    closeTerms,
    contextCartItems,
    ctxAddToCart,
    removeFromCart,
    updateCartItem,
    cartItems,
    setCartItems,
    shippingInfo,
    setShippingInfo,
    shippingErrors,
    setShippingErrors,
    touchedFields,
    setTouchedFields,
    giftValidateKeys,
    setGiftValidateKeys,
    deliveryFee,
    setDeliveryFee,
    deliveryLabel,
    setDeliveryLabel,
    appliedCoupon,
    setAppliedCoupon,
    discountAmount,
    setDiscountAmount,
    promoAutoApplied,
    giftAddon,
    setGiftAddon,
    totalItems,
    nonGiftQty,
    totalPrice,
    giftLineCount,
    addonFeesTotal,
    hasDtfItems,
    grandTotal,
    addToCart,
    validateShippingField,
    updateGiftFields,
    filterShippingInput,
    handleShippingChange,
    handleShippingBlur,
    handleNext,
    handleBack,
    updateItem,
    removeItem,
    handleSubmit,
  };
}

export type Checkout = ReturnType<typeof useCheckout>;
