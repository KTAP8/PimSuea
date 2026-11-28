import { GEO } from '@/content/geoFacts';

/** Copy for /custom-shirts-thailand — meta, hero, steps, delivery, FAQ, closing CTA. */
export const CUSTOM_SHIRTS_THAILAND_COPY = {
  en: {
    title: 'Custom T-Shirts in Thailand, in English — No Minimum, Price Up Front | PimSuea',
    description:
      'How to get custom shirts made in Thailand without speaking Thai: design online, see the THB price instantly, order from 1 piece, pay by card or PromptPay. Printed in Bangkok, delivered to Chiang Mai, Phuket, Pattaya, the islands and all 77 provinces.',
    h1: 'Custom shirts in Thailand. In English. From 1 piece.',
    h1Lines: ['Custom shirts in Thailand.', 'In English.', 'From 1 piece.'],
    eyebrow: "Printed in Bangkok · For people who don't speak Thai (yet)",
    sub: "Design it yourself in your browser, watch the baht price update as you go, and pay by card. No minimum, no quote requests, no “admin will reply tomorrow”.",
    ctaPrimary: 'Design your shirt',
    ctaSecondary: 'See prices',
    // Provinces live in the hero stat pill (HeroTrustStats).
    chips: ['1 pc minimum', 'English on LINE', 'Card or PromptPay'],
    demo: {
      toolbar: 'PimSuea Studio',
      hint: 'Drop your logo here',
      qty: 'Qty 1',
      perPiece: '/ pc',
      file: 'logo.png',
    },
    stepsTitle: 'Three steps. All in English.',
    steps: [
      { title: 'Pick a shirt', body: 'Classic cotton tee or oversized heavyweight. White or colours, S–XL.' },
      { title: 'Drop in your design', body: 'Upload a logo or artwork, drag it into place, pick a print size. The price updates as you go.' },
      { title: 'Pay. We print and ship.', body: `Card or PromptPay. Printed in Bangkok, delivered in ${GEO.printing.leadTimeDays} days.` },
    ],
    deliveryTitle: 'Printed in Bangkok. Delivered wherever you live.',
    deliveryBody:
      'Your condo, the coworking space, the gym, an island bungalow. We ship to every province in Thailand.',
    deliveryStat: `${GEO.printing.leadTimeDays} days`,
    deliveryStatLabel: `to all ${GEO.printing.provinces} provinces`,
    faqTitle: 'Questions people ask before ordering',
    faqExtra: {
      q: "What if the print doesn't look like my mockup?",
      a: "You approve the mockup before we print. If what arrives clearly doesn't match it, we reprint it free within 7 days of delivery. Small position differences (under 2 inches) are normal print tolerance.",
    },
    closingTitle: 'Your crew. Your design. One shirt or fifty.',
    closingBody:
      'Open the studio, drop in your logo and see the exact price in baht. It takes about five minutes. Questions? We answer in English on LINE.',
    stickyLine: 'No minimum',
    stickyFrom: 'From, per shirt',
  },
  th: {
    title: 'สั่งทำเสื้อยืดในไทย ไม่มีขั้นต่ำ รู้ราคาทันที | PimSuea',
    description:
      'สั่งทำเสื้อยืดออนไลน์ในประเทศไทย ออกแบบเองบนเว็บ รู้ราคา THB ทันที สั่ง 1 ตัวได้ จ่ายบัตรหรือ PromptPay ผลิตในกรุงเทพ ส่งทั่ว 77 จังหวัด',
    h1: 'สั่งทำเสื้อในไทย ไม่มีขั้นต่ำ รู้ราคาก่อนสั่ง',
    h1Lines: ['สั่งทำเสื้อในไทย', 'ไม่มีขั้นต่ำ', 'รู้ราคาก่อนสั่ง'],
    eyebrow: 'พิมพ์ในกรุงเทพ · ใช้ได้ทั้งภาษาไทยและอังกฤษ',
    sub: 'ออกแบบเองบนเบราว์เซอร์ เห็นราคาเป็นบาทระหว่างออกแบบ จ่ายบัตรหรือ PromptPay ไม่มีขั้นต่ำ ไม่ต้องขอใบเสนอราคา ไม่ต้องรอแอดมินตอบ',
    ctaPrimary: 'เริ่มออกแบบเสื้อ',
    ctaSecondary: 'ดูราคา',
    chips: ['สั่ง 1 ตัวได้', 'ไทย / อังกฤษ ทาง LINE', 'บัตร หรือ PromptPay'],
    demo: {
      toolbar: 'PimSuea Studio',
      hint: 'ลากโลโก้มาวางตรงนี้',
      qty: 'จำนวน 1',
      perPiece: '/ ตัว',
      file: 'logo.png',
    },
    stepsTitle: 'สามขั้นตอน จบในเว็บเดียว',
    steps: [
      { title: 'เลือกเสื้อ', body: 'เสื้อยืดคอตตอน หรือ oversized heavyweight สีขาวหรือสีอื่น ไซซ์ S–XL' },
      { title: 'ใส่ลายของคุณ', body: 'อัปโหลดโลโก้หรือลาย ลากวาง เลือกขนาดพิมพ์ ราคาอัปเดตทันที' },
      { title: 'จ่ายเงิน แล้วเราพิมพ์และส่ง', body: `บัตรหรือ PromptPay พิมพ์ในกรุงเทพ ได้รับภายใน ${GEO.printing.leadTimeDays} วัน` },
    ],
    deliveryTitle: 'พิมพ์ในกรุงเทพ ส่งถึงทุกที่ที่คุณอยู่',
    deliveryBody: 'คอนโด ออฟฟิศ ยิม หรือบ้านพักบนเกาะ เราส่งครบทุกจังหวัดทั่วไทย',
    deliveryStat: `${GEO.printing.leadTimeDays} วัน`,
    deliveryStatLabel: `ส่งทั่ว ${GEO.printing.provinces} จังหวัด`,
    faqTitle: 'คำถามที่พบบ่อย',
    faqExtra: {
      q: 'ถ้าเสื้อที่ได้ไม่ตรงกับม็อคอัพล่ะ?',
      a: 'คุณอนุมัติม็อคอัพก่อนพิมพ์ทุกครั้ง ถ้าของที่ได้รับไม่ตรงกับม็อคอัพอย่างชัดเจน เราพิมพ์ใหม่ให้ฟรีภายใน 7 วันหลังได้รับสินค้า ตำแหน่งคลาดเคลื่อนไม่เกิน 2 นิ้วถือเป็นค่าคลาดเคลื่อนปกติของการพิมพ์',
    },
    closingTitle: 'ทีมของคุณ ลายของคุณ 1 ตัวหรือ 50 ตัวก็ได้',
    closingBody: 'เปิดสตูดิโอ ใส่โลโก้ แล้วดูราคาจริงเป็นบาท ใช้เวลาประมาณห้านาที มีคำถามทักเราทาง LINE ได้เลย',
    stickyLine: 'ไม่มีขั้นต่ำ',
    stickyFrom: 'เริ่มต้นต่อตัว',
  },
} as const;
