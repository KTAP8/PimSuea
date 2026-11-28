import { getPrice } from "@/services/api";
import type { GiftRecipientInfo } from "@/types/gift";

/** Checkout cart model + server-matching repricing (moved from pages/Order.tsx). */
// Interfaces
export interface SidePriceBreakdown { side: string; tier: string; print_per_unit: number; }
export interface ItemPriceBreakdown {
  sides: SidePriceBreakdown[];
  shirt_per_unit: number;
  total_print_per_unit: number;
  total_per_unit: number;
}

export interface CartItem {
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

export interface ShippingInfo {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  province: string;
  district: string;
  postalCode: string;
}

// Calculate price for all sides, sum print costs, add shirt once
export async function calcMultiSidePrice(
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
export async function repriceAll(items: CartItem[]): Promise<CartItem[]> {
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

