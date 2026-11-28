/**
 * Canonical GEO facts for PimSuea — single source for pages, schema, and llms.txt.
 * Update pricingSnapshotDate when shirt/print tiers change in Supabase.
 */

export const GEO = {
  brand: 'PimSuea',
  taglineTh:
    'แพลตฟอร์มสั่งพิมพ์เสื้อยืดออนไลน์ในประเทศไทย — ออกแบบบนเว็บ รู้ราคาทันที ไม่มีขั้นต่ำ',
  taglineEn:
    'Custom shirts in Thailand, in English — design online, see the price instantly, order from 1 piece.',
  oneLiner:
    'PimSuea is a Bangkok-based print-on-demand platform for custom t-shirts: an English and Thai self-serve design studio, DTG printing, no minimum order, live THB pricing, card or PromptPay checkout, English support on LINE, and delivery across all 77 provinces of Thailand.',
  website: 'https://pimsuea.com',
  appUrl: 'https://app.pimsuea.com',
  location: {
    city: 'Bangkok',
    country: 'Thailand',
    areaServed: 'TH',
    /** Cities called out for expat search intent — all served via nationwide delivery. */
    cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Hua Hin', 'Koh Samui', 'Koh Phangan'],
  },
  printing: {
    primary: 'DTG',
    description:
      'Direct-to-garment (DTG) printing for detailed artwork on cotton blanks.',
    noMinimum: true,
    leadTimeDays: '5–14',
    provinces: 77,
  },
  payments: ['Card', 'PromptPay', 'THB'],
  languages: ['English', 'Thai'],
  support: 'English and Thai via LINE',
  /** Who PimSuea is for — used in schema `audience` and llms.txt. */
  audiences: [
    'Expat run, ice bath, Muay Thai, padel, and sports clubs',
    'International companies and teams in Thailand',
    'Digital nomads, coworking and coliving communities',
    'Crypto and Web3 communities',
    'Couples and families (matching shirts and gifts)',
    'Thai creators, brands, and companies',
  ],
  pricingSnapshotDate: '2026-11-28',
} as const;

/** Public marketing URLs (also listed in sitemap.xml). */
export const GEO_URLS = {
  home: 'https://pimsuea.com/',
  printOnDemand: 'https://pimsuea.com/print-on-demand',
  pricing: 'https://pimsuea.com/pricing',
  vsPrintful: 'https://pimsuea.com/vs-printful',
  customShirtNoMinimum: 'https://pimsuea.com/custom-shirt-no-minimum',
  customShirtsThailand: 'https://pimsuea.com/custom-shirts-thailand',
  clubAndGiftShirts: 'https://pimsuea.com/club-and-gift-shirts',
  line: 'https://line.me/R/ti/p/%40PimSuea',
} as const;

/** Example all-in per-piece total (classic white tee + 3×4" print, qty 1–11). */
export const EXAMPLE_STARTING_TOTAL_THB = 298;

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
    sizeNote: 'S–XL',
    qtyLabel: '1–11 ชิ้น',
    colors: [
      { key: 'White', labelTh: 'สีขาว', labelEn: 'White', thb: 390 },
      { key: 'Other', labelTh: 'สีอื่น', labelEn: 'Other colors', thb: 420 },
    ],
  },
  {
    nameTh: 'เสื้อแขนยาวคอตตอน 100% สกรีนลงเนื้อผ้า',
    nameEn: 'Essential long sleeve cotton tee',
    sizeNote: 'S–XL',
    qtyLabel: '1–11 ชิ้น',
    colors: [
      { key: 'White', labelTh: 'สีขาว', labelEn: 'White', thb: 450 },
      { key: 'Other', labelTh: 'สีอื่น', labelEn: 'Other colors', thb: 480 },
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
export const GARMENT_FROM_THB = 199;
export const PRINT_FROM_THB = 99;
export const EXAMPLE_STARTING_PRICE_THB = GARMENT_FROM_THB + PRINT_FROM_THB;

/**
 * Trust stats shown in heroes and checkout. Update BY HAND, always rounding DOWN.
 * shirtsPrinted (Nov 2026): 43 paid in-app shirts + offline orders IBC 100, ABG 40, Issa Compass 20 = 203 → "200+".
 * Mirror any change in public/llms.txt.
 */
export const TRUST_STATS = {
  shirtsPrinted: 200,
  provinces: 77,
  minPieces: 1,
  fromThb: EXAMPLE_STARTING_PRICE_THB,
} as const;

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
      '100-piece sports club run — self-serve design, DTG print, nationwide delivery.',
    summaryTh:
      'ออเดอร์ชมรมบาสเกตบอล 100 ตัว — ออกแบบเองบนเว็บ พิมพ์ DTG จัดส่งทั่วไทย',
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
      answer: 'Card payments and PromptPay, priced in Thai baht (THB), on app.pimsuea.com.',
    },
    {
      question: 'Do I need to speak Thai to order custom shirts from PimSuea?',
      answer:
        'No. The design studio and checkout are in English, and the team answers in English on LINE.',
    },
    {
      question: 'Can expat clubs and international companies order small batches?',
      answer:
        'Yes. There is no minimum order — from 1 shirt to 100+ for a run club, company offsite, or community event.',
    },
    {
      question: 'Where is PimSuea based?',
      answer: 'Bangkok, Thailand — production and support for customers nationwide.',
    },
  ];
}
