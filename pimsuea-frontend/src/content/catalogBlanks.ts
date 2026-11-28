/** Active catalog blanks — keep in sync with Supabase `products` (id, title, title_en). */
export const CATALOG_BLANKS = {
  classic: {
    productId: '0de86104-0582-4da2-84c5-f46a2878d122',
    titleEn: 'DTG 100% cotton tshirt',
    titleTh: 'เสื้อยืดสกรีนลงเนื้อผ้า',
  },
  boxy: {
    productId: '4e518b71-a23b-4841-aaea-d3fb924d999c',
    titleEn: 'Oversized boxy heavyweight tee',
    titleTh: 'เสื้อ oversized boxy heavyweight tee สกรีนลงเนื้อผ้า',
  },
  longsleeve: {
    productId: 'b5378aed-801b-4f56-9fb9-1a84a44c8790',
    titleEn: 'Essential long sleeve cotton tee',
    titleTh: 'เสื้อแขนยาวคอตตอน 100% สกรีนลงเนื้อผ้า',
  },
} as const;

/** "Start designing" lands here — the cheapest blank (from ฿298 with print). */
export const DEFAULT_STUDIO_PRODUCT_ID = CATALOG_BLANKS.classic.productId;
