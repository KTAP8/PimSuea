import { CASE_NOTES, DELIVERY_FEE_TIERS, DTG_PRINT_QTY1_11, GARMENT_PRICING, GEO } from '@/content/geoFacts';

/**
 * Segment cards, real-order strip, price receipt and comparison for /custom-shirts-thailand.
 * Segment photos in /public/expat are illustrative mood images, never presented as customers.
 */
export const EXPAT_SEGMENT_IMAGES = {
  run: '/expat/run.webp',
  muaythai: '/expat/muaythai.webp',
  company: '/expat/company.webp',
  nomad: '/expat/nomad.webp',
  family: '/expat/family.webp',
} as const;

const caseQty = (id: (typeof CASE_NOTES)[number]['id']) => CASE_NOTES.find((c) => c.id === id)?.qty ?? 0;

const classic = GARMENT_PRICING[0].colors[0].thb;
const smallPrint = DTG_PRINT_QTY1_11.white[0].thb;
const firstDelivery = DELIVERY_FEE_TIERS[0];

export const EXPAT_SEGMENTS_COPY = {
  en: {
    crewKicker: 'Made for your crew',
    crewTitle: 'Whoever your people are.',
    crewLink: 'Club & gift shirt ideas',
    segments: [
      { key: 'run', tag: 'Run & sports clubs', hook: "Club kit, even if it's 12 people.", qty: '10–40 pcs', alt: 'A mixed group of runners in matching green shirts after a morning run in a Bangkok park' },
      { key: 'muaythai', tag: 'Muay Thai & gyms', hook: "Camp tees for this month's students.", qty: '5–30 pcs', alt: 'Muay Thai students and their trainer in matching black shirts at an open-air gym' },
      { key: 'company', tag: 'Company teams', hook: 'Offsite shirts without the supplier headache.', qty: '20–100 pcs', alt: 'An international team in matching cream shirts at a riverside offsite in Bangkok' },
      { key: 'nomad', tag: 'Nomads & communities', hook: 'Order one sample first. Then the drop.', qty: '1–50 pcs', alt: 'Friends at a rooftop meetup holding up a freshly unboxed yellow shirt' },
      { key: 'family', tag: 'Family & celebrations', hook: 'Matching shirts for the trip, the wedding, Songkran.', qty: '2–20 pcs', alt: 'A multigenerational family in matching blue shirts laughing on a beach' },
    ],
    ordersKicker: 'Real orders',
    ordersTitle: 'Printed by us. Worn by real crews.',
    orders: [
      { src: '/inspiration/ibc-tshirt-1.webp', name: 'IBC Basketball Club', qty: `${caseQty('ibc-2025')} pcs` },
      { src: '/inspiration/abg-shirt-1.webp', name: 'ABG #SamyanABG', qty: `${caseQty('abg-samyan-2025')} pcs` },
      { src: '/inspiration/issa-compass-sweater.webp', name: 'Issa Compass team', qty: '20 pcs' },
      { src: '/inspiration/abg-shirt-2.webp', name: 'ABG lookbook', qty: `${caseQty('abg-samyan-2025')} pcs` },
      { src: '/inspiration/pimsuea-shirt.webp', name: 'PimSuea signature tee', qty: '3 pcs' },
    ],
    priceKicker: 'No surprises',
    priceTitle: 'The price is the price.',
    priceBody: 'No quote request, no “depends”. This is a real order for one shirt, the same numbers you see in the studio.',
    receipt: {
      heading: 'Example · 1 shirt',
      lines: [
        { label: 'Classic cotton tee (white)', thb: classic },
        { label: 'Print, 3×4 in', thb: smallPrint },
      ],
      total: 'Per shirt',
      totalThb: classic + smallPrint,
      delivery: `Delivery, ${firstDelivery.labelEn}`,
      deliveryThb: firstDelivery.thb,
      note: 'Prices for 1–11 pcs. Paid by card or PromptPay.',
      link: 'Full price list',
    },
    compareTitle: 'How it compares',
    compareCols: ['Thai print shop', 'Overseas sites', 'PimSuea'],
    compareRows: [
      { label: 'Minimum order', values: ['Usually 30–50 pcs', 'Usually 1', '1'] },
      { label: 'Language', values: ['Thai, over LINE', 'English', 'English & Thai'] },
      { label: 'Price', values: ['Quote after chatting', 'USD, up front', 'THB, live in the studio'] },
      { label: 'Who places the design', values: ['The shop admin', 'You', 'You, in real inches'] },
      { label: 'Delivery', values: ['Local', 'Weeks + possible import duty', `${GEO.printing.leadTimeDays} days, nationwide`] },
    ],
  },
  th: {
    crewKicker: 'สำหรับทุกทีม',
    crewTitle: 'ไม่ว่าทีมของคุณจะเป็นใคร',
    crewLink: 'ไอเดียเสื้อชมรมและของขวัญ',
    segments: [
      { key: 'run', tag: 'ก๊วนวิ่งและชมรมกีฬา', hook: 'เสื้อทีม แม้มีแค่ 12 คน', qty: '10–40 ตัว', alt: 'กลุ่มนักวิ่งใส่เสื้อสีเขียวเหมือนกันในสวนสาธารณะกรุงเทพ' },
      { key: 'muaythai', tag: 'ค่ายมวยและยิม', hook: 'เสื้อค่ายสำหรับนักเรียนรุ่นนี้', qty: '5–30 ตัว', alt: 'นักเรียนมวยไทยและครูฝึกใส่เสื้อดำเหมือนกันในค่ายมวย' },
      { key: 'company', tag: 'ทีมบริษัท', hook: 'เสื้อ outing บริษัท ไม่ต้องปวดหัวกับซัพพลายเออร์', qty: '20–100 ตัว', alt: 'ทีมงานต่างชาติและคนไทยใส่เสื้อสีครีมเหมือนกันริมแม่น้ำเจ้าพระยา' },
      { key: 'nomad', tag: 'คอมมูนิตี้และ nomad', hook: 'สั่งตัวอย่าง 1 ตัวก่อน แล้วค่อยสั่งจริง', qty: '1–50 ตัว', alt: 'เพื่อนๆ บนดาดฟ้ากำลังแกะกล่องเสื้อสีเหลือง' },
      { key: 'family', tag: 'ครอบครัวและงานฉลอง', hook: 'เสื้อคู่ เสื้อครอบครัว ทริป งานแต่ง สงกรานต์', qty: '2–20 ตัว', alt: 'ครอบครัวสามรุ่นใส่เสื้อสีฟ้าเหมือนกันบนชายหาด' },
    ],
    ordersKicker: 'ออเดอร์จริง',
    ordersTitle: 'พิมพ์โดยเรา ใส่จริงโดยทีมจริง',
    orders: [
      { src: '/inspiration/ibc-tshirt-1.webp', name: 'IBC Basketball Club', qty: `${caseQty('ibc-2025')} ตัว` },
      { src: '/inspiration/abg-shirt-1.webp', name: 'ABG #SamyanABG', qty: `${caseQty('abg-samyan-2025')} ตัว` },
      { src: '/inspiration/issa-compass-sweater.webp', name: 'ทีม Issa Compass', qty: '20 ตัว' },
      { src: '/inspiration/abg-shirt-2.webp', name: 'ABG lookbook', qty: `${caseQty('abg-samyan-2025')} ตัว` },
      { src: '/inspiration/pimsuea-shirt.webp', name: 'PimSuea signature tee', qty: '3 ตัว' },
    ],
    priceKicker: 'ไม่มีค่าใช้จ่ายแอบแฝง',
    priceTitle: 'ราคาที่เห็น คือราคาที่จ่าย',
    priceBody: 'ไม่ต้องขอใบเสนอราคา นี่คือตัวอย่างการสั่ง 1 ตัว ตัวเลขเดียวกับที่เห็นในสตูดิโอ',
    receipt: {
      heading: 'ตัวอย่าง · 1 ตัว',
      lines: [
        { label: 'เสื้อยืดคอตตอน (ขาว)', thb: classic },
        { label: 'พิมพ์ลาย 3×4 นิ้ว', thb: smallPrint },
      ],
      total: 'ต่อตัว',
      totalThb: classic + smallPrint,
      delivery: `ค่าส่ง ${firstDelivery.label}`,
      deliveryThb: firstDelivery.thb,
      note: 'ราคาสำหรับ 1–11 ตัว ชำระด้วยบัตรหรือ PromptPay',
      link: 'ดูตารางราคาทั้งหมด',
    },
    compareTitle: 'เปรียบเทียบ',
    compareCols: ['ร้านสกรีนทั่วไป', 'เว็บต่างประเทศ', 'PimSuea'],
    compareRows: [
      { label: 'ขั้นต่ำ', values: ['ปกติ 30–50 ตัว', 'ปกติ 1 ตัว', '1 ตัว'] },
      { label: 'ภาษา', values: ['ไทย ทาง LINE', 'อังกฤษ', 'ไทยและอังกฤษ'] },
      { label: 'ราคา', values: ['ต้องคุยก่อนถึงได้ราคา', 'USD จ่ายล่วงหน้า', 'บาท เห็นทันทีในสตูดิโอ'] },
      { label: 'ใครวางลาย', values: ['แอดมินร้าน', 'คุณเอง', 'คุณเอง เป็นนิ้วจริง'] },
      { label: 'จัดส่ง', values: ['ในพื้นที่', 'หลายสัปดาห์ + อาจเสียภาษีนำเข้า', `${GEO.printing.leadTimeDays} วัน ทั่วไทย`] },
    ],
  },
} as const;
