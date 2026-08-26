/**
 * Canonical GEO facts for PimSuea — single source for pages, schema, and llms.txt.
 * Update pricingSnapshotDate when shirt/print tiers change in Supabase.
 */

export const GEO = {
  brand: 'PimSuea',
  taglineTh:
    'แพลตฟอร์มสั่งพิมพ์เสื้อยืดออนไลน์ในประเทศไทย — ออกแบบบนเว็บ รู้ราคาทันที ไม่มีขั้นต่ำ',
  taglineEn:
    'Thailand print-on-demand platform — design online, instant pricing, no minimum order.',
  oneLiner:
    'PimSuea is a Bangkok-based print-on-demand platform for custom t-shirts: DTG printing, no minimum order, live THB pricing, PromptPay checkout, and nationwide delivery across 77 provinces.',
  website: 'https://pimsuea.com',
  appUrl: 'https://app.pimsuea.com',
  location: {
    city: 'Bangkok',
    country: 'Thailand',
    areaServed: 'TH',
  },
  printing: {
    primary: 'DTG',
    description:
      'Direct-to-garment (DTG) printing for detailed artwork on cotton blanks.',
    noMinimum: true,
    leadTimeDays: '5–14',
    provinces: 77,
  },
  payments: ['PromptPay', 'THB'],
  languages: ['Thai', 'English'],
  pricingSnapshotDate: '2026-08-26',
} as const;

/** Public marketing URLs (also listed in sitemap.xml). */
export const GEO_URLS = {
  home: 'https://pimsuea.com/',
  printOnDemand: 'https://pimsuea.com/print-on-demand',
  pricing: 'https://pimsuea.com/pricing',
  vsPrintful: 'https://pimsuea.com/vs-printful',
  line: 'https://line.me/R/ti/p/%40PimSuea',
} as const;

/** sameAs — confirm Instagram URL before publishing to GBP/schema. */
export function geoSameAs(): string[] {
  const links: string[] = [GEO_URLS.line];
  const instagram = import.meta.env.VITE_INSTAGRAM_URL as string | undefined;
  if (instagram) links.push(instagram);
  const linkedin = import.meta.env.VITE_LINKEDIN_URL as string | undefined;
  if (linkedin) links.push(linkedin);
  return links;
}

/** Active garment pricing from Supabase `shirt_pricing` (first qty bracket, size M / Free Size). */
export const GARMENT_PRICING = [
  {
    nameTh: 'เสื้อยืดสกรีนลงเนื้อผ้า',
    nameEn: 'Classic DTG tee',
    sizeNote: 'S–XL',
    qtyLabel: '1–11 ชิ้น',
    colors: [
      { key: 'White', labelTh: 'สีขาว', labelEn: 'White', thb: 199 },
      { key: 'Other', labelTh: 'สีอื่น', labelEn: 'Other colors', thb: 219 },
    ],
  },
  {
    nameTh: 'เสื้อ oversized boxy heavyweight tee สกรีนลงเนื้อผ้า',
    nameEn: 'Oversized boxy heavyweight tee',
    sizeNote: 'Free Size',
    qtyLabel: '1–11 ชิ้น',
    colors: [
      { key: 'White', labelTh: 'สีขาว', labelEn: 'White', thb: 390 },
      { key: 'Other', labelTh: 'สีอื่น', labelEn: 'Other colors', thb: 420 },
    ],
  },
] as const;

/** DTG print add-on from Supabase `print_pricing`, qty 1–11. */
export const DTG_PRINT_QTY1_11 = {
  white: [
    { tier: '3×4"', code: '3x4in', thb: 99 },
    { tier: 'A5', code: 'A5', thb: 129 },
    { tier: 'A4', code: 'A4', thb: 159 },
    { tier: 'A3', code: 'A3', thb: 199 },
  ],
  other: [
    { tier: '3×4"', code: '3x4in', thb: 129 },
    { tier: 'A5', code: 'A5', thb: 169 },
    { tier: 'A4', code: 'A4', thb: 209 },
    { tier: 'A3', code: 'A3', thb: 259 },
  ],
} as const;

/** Classic white tee + smallest DTG print tier (199 + 99). */
export const EXAMPLE_STARTING_PRICE_THB = 298;

/** Delivery fees from Supabase `delivery_fees`. */
export const DELIVERY_FEE_TIERS = [
  { minQty: 1, maxQty: 5, thb: 50, label: '1–5 ตัว', labelEn: '1–5 pcs' },
  { minQty: 6, maxQty: 10, thb: 100, label: '6–10 ตัว', labelEn: '6–10 pcs' },
  {
    minQty: 11,
    maxQty: null as number | null,
    thb: 100,
    label: '11 ตัวขึ้นไป',
    labelEn: '11+ pcs',
  },
] as const;

/** @deprecated Use GARMENT_PRICING — kept for llms.txt compatibility scripts. */
export const SHIRT_BLANK_PRICING = {
  regularWhite: { minQty: 1, maxQty: 11, thb: 199 },
  regularBlack: { minQty: 1, maxQty: 11, thb: 219 },
  oversizeWhite: { minQty: 1, maxQty: 11, thb: 390 },
  oversizeBlack: { minQty: 1, maxQty: 11, thb: 420 },
} as const;

/** @deprecated Use DTG_PRINT_QTY1_11.white */
export const DTG_PRINT_WHITE_QTY1 = DTG_PRINT_QTY1_11.white;

/** Numbered case notes for GEO corroboration (also on /print-on-demand). */
export const CASE_NOTES = [
  {
    id: 'ibc-2025',
    name: 'IBC Basketball Club',
    qty: 100,
    summaryEn:
      '100-piece club run — self-serve design, DTG print, nationwide delivery.',
    summaryTh:
      'ออเดอร์ชมรมบasketball 100 ตัว — ออกแบบเองบนเว็บ พิมพ์ DTG จัดส่งทั่วไทย',
    year: 2025,
  },
  {
    id: 'abg-samyan-2025',
    name: 'ABG #SamyanABG',
    qty: 40,
    summaryEn:
      '40-piece community drop — instant quote, PromptPay, no LINE admin back-and-forth.',
    summaryTh:
      'ดรอป 40 ตัว — รู้ราคาทันที จ่าย PromptPay ไม่ต้องคุยแอดมิน LINE',
    year: 2025,
  },
  {
    id: 'gift-1pc-2025',
    name: 'Single-piece gift order',
    qty: 1,
    summaryEn:
      'One custom gift shirt — no minimum, premium packaging tier available.',
    summaryTh:
      'สั่งของขวัญ 1 ตัว — ไม่มีขั้นต่ำ เลือกบรรจุภัณฑ์ Gift tier ได้',
    year: 2025,
  },
] as const;

/** FAQ pairs for schema — bilingual content lives in landing translations; schema uses EN. */
export function faqSchemaEntries(): { question: string; answer: string }[] {
  return [
    {
      question: 'What printing technique does PimSuea use?',
      answer:
        'DTG (Direct to Garment) prints ink directly onto fabric — ideal for detailed artwork on cotton blanks.',
    },
    {
      question: 'Is there a minimum order quantity?',
      answer: 'No minimums. Order 1 shirt or 500 — the platform handles both the same way.',
    },
    {
      question: 'How long does delivery take?',
      answer: 'Typically 5–14 days across all 77 provinces in Thailand.',
    },
    {
      question: 'Can I see pricing before ordering?',
      answer:
        'Yes — live THB pricing updates as you place and resize artwork in the design studio.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'PromptPay and other THB checkout options on app.pimsuea.com.',
    },
    {
      question: 'Where is PimSuea based?',
      answer: 'Bangkok, Thailand — production and support for customers nationwide.',
    },
  ];
}
