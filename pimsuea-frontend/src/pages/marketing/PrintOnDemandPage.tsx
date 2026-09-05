import { useState } from 'react';
import {
  CASE_NOTES,
  GEO,
  GEO_URLS,
} from '@/content/geoFacts';
import { buildCaseNotesJsonLd, buildGeoJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  FactList,
  MarketingAnswerLayout,
  useMarketingLang,
} from '@/components/MarketingAnswerLayout';
import { motion } from 'framer-motion';
import {
  Zap,
  Sparkles,
  Truck,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Shirt,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appUrl } from '@/lib/site';

function HeroVisual() {
  const { lang } = useMarketingLang();
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/15 blur-[60px] rounded-full -z-10" />

      <div className="relative rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
        {/* Top Window Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground bg-secondary/50 px-2.5 py-0.5 rounded-md">
            pimsuea.com/studio
          </span>
        </div>

        {/* T-Shirt Center Mockup Graphic */}
        <div className="relative aspect-4/3 rounded-xl bg-secondary/30 flex items-center justify-center p-6 border border-border/40 overflow-hidden group">
          <svg
            width="160"
            height="180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            className="text-foreground/30 transition-transform group-hover:scale-105 duration-500"
          >
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>

          {/* Graphic Overlay on Shirt */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-primary/60 border-dashed rounded-lg bg-primary/10 flex flex-col items-center justify-center p-2 text-center shadow-inner">
            <Sparkles className="w-4 h-4 text-primary mb-1 animate-pulse" />
            <span className="text-[9px] font-black text-primary tracking-wider uppercase">
              DTG PRINT
            </span>
          </div>

          {/* Floating Price Pill */}
          <div className="absolute bottom-3 right-3 bg-action text-action-foreground font-black text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>~฿298 / pc</span>
          </div>

          {/* Floating No MOQ Badge */}
          <div className="absolute top-3 left-3 bg-card/90 border border-border/80 text-foreground font-bold text-[11px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            <span>{lang === 'en' ? 'No MOQ (1 pc)' : 'ไม่มีขั้นต่ำ (1 ตัว)'}</span>
          </div>
        </div>

        {/* Feature Checkpoints */}
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>{lang === 'en' ? 'Instant Live Quote' : 'คำนวณราคาสด'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>{lang === 'en' ? 'PromptPay Checkout' : 'สแกน PromptPay'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar() {
  const { lang } = useMarketingLang();
  const stats = [
    {
      num: '0',
      unit: lang === 'en' ? 'Minimum MOQ' : 'ขั้นต่ำ (สั่ง 1 ตัวได้)',
      desc: lang === 'en' ? 'Order 1 or 500+ shirts' : 'สั่งกี่ตัวก็ได้ ราคาแฟร์',
    },
    {
      num: `${GEO.printing.leadTimeDays}`,
      unit: lang === 'en' ? 'Days Turnaround' : 'วัน ระยะเวลาผลิต',
      desc: lang === 'en' ? 'Fast Bangkok fulfillment' : 'ผลิตและส่งไวจาก กทม.',
    },
    {
      num: `${GEO.printing.provinces}`,
      unit: lang === 'en' ? 'Provinces' : 'จังหวัด ทั่วประเทศ',
      desc: lang === 'en' ? 'Nationwide doorstep delivery' : 'จัดส่งตรงถึงหน้าบ้าน',
    },
    {
      num: '100%',
      unit: lang === 'en' ? 'DTG Inkjet' : 'Direct-to-Garment',
      desc: lang === 'en' ? 'Sharp color on cotton' : 'สกรีนสีสด นุ่ม ไม่ลอกแตก',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
      {stats.map((s, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl border border-border/80 bg-card/60 hover:bg-card/90 hover:border-primary/30 transition-all shadow-xs"
        >
          <p className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
            {s.num}
          </p>
          <p className="text-sm font-bold text-foreground mt-1">{s.unit}</p>
          <p className="text-xs text-muted-foreground font-light mt-0.5">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

function BentoFeatures() {
  const { lang } = useMarketingLang();
  const features = [
    {
      num: '01',
      titleTh: 'สั่ง 1 ตัวก็พิมพ์ได้ ไม่มีขั้นต่ำ',
      titleEn: 'No Minimum Order (Zero MOQ)',
      descTh:
        'ไม่ต้องรวมยอดให้ครบโหล ไม่ต้องสั่งสต็อกเยอะ เหมาะสำหรับของขวัญวันเกิด เสื้อคู่ เสื้อตัวอย่าง หรือใส่เอง',
      descEn:
        'Order 1 piece or 500. No minimum quantity constraints, perfect for personal gifts, custom drops, and samples.',
      icon: Shirt,
    },
    {
      num: '02',
      titleTh: 'รู้ราคาทันที ไม่ต้องรอแอดมินตอบ LINE',
      titleEn: 'Instant Transparent Live Pricing',
      descTh:
        'ระบบคำนวณราคาเสื้อและค่าพิมพ์อัตโนมัติตามขนาดลายที่เลือกแบบเรียลไทม์ พร้อมยอดรวมโปร่งใส ไม่มีค่าใช้จ่ายแอบแฝง',
      descEn:
        'Dynamic engine calculates garment and print tier costs instantly in your browser in THB without admin delays.',
      icon: Zap,
    },
    {
      num: '03',
      titleTh: 'สกรีนระบบ DTG คุณภาพพรีเมียม',
      titleEn: 'High-Definition DTG Printing',
      descTh:
        'หมึกพิมพ์ซึมลงเนื้อผ้า Cotton คุณภาพสูง สีสันคมชัด ไล่เฉดสีได้ทุกรายละเอียด สัมผัสนุ่มสบาย ระบายอากาศดีเยี่ยม',
      descEn:
        'Direct-to-Garment tech fuses premium ink into cotton fibers for soft-hand touch, vibrant color gradients, and wash durability.',
      icon: Sparkles,
    },
    {
      num: '04',
      titleTh: 'ชำระ PromptPay & จัดส่งทั่วไทย 77 จังหวัด',
      titleEn: 'PromptPay Checkout & Nationwide Delivery',
      descTh:
        'สแกน QR PromptPay ชำระเงินได้ทันที พร้อมระบบติดตามสถานะพัสดุจัดส่งตรงถึงหน้าบ้านทุกจังหวัดในไทย',
      descEn:
        'Frictionless QR PromptPay payment with order tracking straight to your door across all 77 Thai provinces.',
      icon: Truck,
    },
  ];

  return (
    <div className="space-y-6 my-12">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          {lang === 'en'
            ? 'Why Choose PimSuea for Print on Demand?'
            : 'ทำไมต้อง Print on Demand กับ PimSuea?'}
        </h2>
        <p className="text-sm text-muted-foreground font-light mt-2">
          {lang === 'en'
            ? 'We reimagined custom t-shirt printing to be frictionless and accessible to everyone.'
            : 'เราเปลี่ยนการสั่งเสื้อยืดแบบเดิมๆ ให้ง่าย สะดวก รวดเร็ว และไม่ต้องผ่านขั้นตอนที่ยุ่งยาก'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="relative p-7 sm:p-8 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-xl transition-all group overflow-hidden"
            >
              {/* Number watermark */}
              <span className="absolute -bottom-4 -right-2 font-black text-7xl text-muted/15 select-none group-hover:text-primary/10 transition-colors">
                {f.num}
              </span>

              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors">
                  {lang === 'en' ? f.titleEn : f.titleTh}
                </h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {lang === 'en' ? f.descEn : f.descTh}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HowItWorks() {
  const { lang } = useMarketingLang();
  const steps = [
    {
      step: '1',
      titleTh: 'เลือกเสื้อ & อัปโหลดลาย',
      titleEn: 'Pick Garment & Upload Artwork',
      descTh: 'เลือกทรงเสื้อ (Classic หรือ Oversized) และอัปโหลดไฟล์ภาพ (PNG/SVG)',
      descEn: 'Choose your shirt silhouette and drop your artwork file directly into the browser.',
    },
    {
      step: '2',
      titleTh: 'จัดวางลาย & ดูราคาเรียลไทม์',
      titleEn: 'Position Graphic & See Live Price',
      descTh: 'ปรับขนาดลาย หมุน ย้ายตำแหน่ง พร้อมดูราคาสุทธิอัปเดตทันทีแบบไม่มีกั๊ก',
      descEn: 'Scale, rotate, position your design, and see the exact per-piece quote calculate live.',
    },
    {
      step: '3',
      titleTh: 'สแกนจ่าย & รอรับเสื้อถึงบ้าน',
      titleEn: 'PromptPay Checkout & Fast Delivery',
      descTh: 'ชำระเงินผ่าน PromptPay ระบบเริ่มผลิตด้วยเครื่องพิมพ์ DTG และจัดส่งถึงบ้าน',
      descEn: 'Pay effortlessly with QR PromptPay, and we fulfill & ship directly across Thailand.',
    },
  ];

  return (
    <div className="p-8 sm:p-10 rounded-3xl border border-border/80 bg-secondary/20 my-12">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          {lang === 'en' ? 'Simple 3-Step Process' : 'ขั้นตอนง่ายๆ ใน 3 สเต็ป'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-1">
          {lang === 'en' ? 'How It Works' : 'สั่งง่ายใน 3 ขั้นตอน'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col items-center text-center space-y-3"
          >
            <div className="w-10 h-10 rounded-full bg-action text-action-foreground font-black text-base flex items-center justify-center shadow-sm">
              {s.step}
            </div>
            <h3 className="font-bold text-base text-foreground">
              {lang === 'en' ? s.titleEn : s.titleTh}
            </h3>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              {lang === 'en' ? s.descEn : s.descTh}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseStudies() {
  const { lang } = useMarketingLang();

  return (
    <div className="space-y-6 my-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {lang === 'en' ? 'Verified Client Runs' : 'ผลงานจริงจากผู้ใช้งาน'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">
            {lang === 'en' ? 'Real Customer Orders' : 'งานจริงจากลูกค้า'}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground font-light max-w-xs">
          {lang === 'en'
            ? 'From 1-piece custom gifts to 100+ club merchandise drops.'
            : 'ตั้งแต่สั่ง 1 ตัวของขวัญ ไปจนถึงเสื้อชมรมและแบรนด์กว่า 100 ชิ้น'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CASE_NOTES.map((note) => (
          <div
            key={note.id}
            className="p-6 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black text-lg text-foreground">{note.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {note.qty} {lang === 'en' ? 'pcs' : 'ชิ้น'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {lang === 'en' ? note.summaryEn : note.summaryTh}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground/80 pt-2 border-t border-border/50">
              <span className="flex items-center gap-1 font-medium text-foreground/80">
                <Award className="w-3.5 h-3.5 text-primary" />
                {lang === 'en' ? 'Verified Production' : 'งานพิมพ์จริง'}
              </span>
              <span>{note.year}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqAccordion() {
  const { lang } = useMarketingLang();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      qTh: 'PimSuea คืออะไร แตกต่างจากร้านสกรีนทั่วไปอย่างไร?',
      qEn: 'What is PimSuea and how does it differ from traditional print shops?',
      aTh:
        'PimSuea เป็นแพลตฟอร์ม Print on Demand แบบ Self-serve สัญชาติไทย คุณสามารถออกแบบเสื้อยืด ดูตัวอย่าง 3D และเห็นราคาแบบเรียลไทม์บนหน้าเว็บได้ทันทีโดยไม่ต้องคุยแอดมิน LINE หรือรอใบเสนอราคา สั่งพิมพ์ได้ตั้งแต่ 1 ตัวด้วยเทคนิค DTG พรีเมียม และชำระผ่าน PromptPay สะดวก รวดเร็ว',
      aEn:
        'PimSuea is a modern Bangkok-based print-on-demand platform. You can design in the browser, preview your tee in real time, get instant THB quotes without waiting for LINE admins, and order with zero minimums using premium DTG printing and PromptPay checkout.',
    },
    {
      qTh: 'มีจำนวนขั้นต่ำในการสั่งพิมพ์หรือไม่?',
      qEn: 'Is there a minimum order quantity (MOQ)?',
      aTh:
        'ไม่มีขั้นต่ำเลย คุณสามารถสั่งพิมพ์เพียง 1 ตัวสำหรับใส่เองหรือเป็นของขวัญชิ้นพิเศษได้ทันที และหากสั่งจำนวนมาก (12 ตัวขึ้นไป) ระบบจะมีส่วนลดตามจำนวนให้โดยอัตโนมัติ',
      aEn:
        'No minimum order quantity whatsoever. You can print a single piece for yourself or as a gift, or order 100+ pieces for clubs and events with automatic volume discounts.',
    },
    {
      qTh: 'ใช้เทคโนโลยีการพิมพ์แบบไหน?',
      qEn: 'What printing technology is used?',
      aTh:
        'เราใช้เทคโนโลยีการพิมพ์ DTG (Direct-to-Garment) ระดับพรีเมียม ซึ่งพิมพ์หมึกลงบนเส้นใยผ้าโดยตรง ให้ความคมชัดสูง ไล่เฉดสีได้ทุกมิติ ผิวสัมผัสนุ่มสบาย ไม่เหนียวเหนอะหนะ และทนต่อการซัก',
      aEn:
        'We use high-definition Direct-to-Garment (DTG) printing. Ink is bonded directly into the cotton fibers for vibrant gradient reproduction, soft-hand texture, and high wash durability without screen setup fees.',
    },
    {
      qTh: 'ระยะเวลาผลิตและจัดส่งนานแค่ไหน?',
      qEn: 'How long does production and shipping take?',
      aTh:
        `ระยะเวลาผลิตและจัดส่งประมาณ ${GEO.printing.leadTimeDays} วัน โดยเราจัดส่งตรงถึงหน้าบ้านทั่วประเทศ ${GEO.printing.provinces} จังหวัด พร้อมเลขพัสดุให้ตรวจสอบได้ตลอดเวลา`,
      aEn:
        `Typical turnaround is ${GEO.printing.leadTimeDays} days from order confirmation to doorstep delivery across all ${GEO.printing.provinces} provinces in Thailand.`,
    },
  ];

  return (
    <div className="my-12 p-6 sm:p-8 rounded-3xl border border-border/80 bg-card">
      <h2 className="text-2xl sm:text-3xl font-black mb-6">
        {lang === 'en' ? 'Frequently Asked Questions' : 'คำถามที่พบบ่อย (FAQ)'}
      </h2>
      <div className="divide-y divide-border/60">
        {faqs.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="py-4">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center justify-between text-left gap-4 font-bold text-base hover:text-primary transition-colors cursor-pointer"
              >
                <span>{lang === 'en' ? faq.qEn : faq.qTh}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'
                  }`}
                />
              </button>
              {isOpen && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 text-sm text-muted-foreground font-light leading-relaxed"
                >
                  {lang === 'en' ? faq.aEn : faq.aTh}
                </motion.p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PrintOnDemandPage() {
  const jsonLd = [
    buildGeoJsonLd({
      pageUrl: GEO_URLS.printOnDemand,
      pageName: 'Print on demand Thailand — PimSuea',
      faq: true,
    }),
    buildCaseNotesJsonLd(),
  ];

  const { lang } = useMarketingLang();

  const factsTh = [
    { label: 'เทคนิคพิมพ์', value: 'DTG (Direct to Garment)' },
    { label: 'ขั้นต่ำ', value: 'ไม่มี — สั่ง 1 ตัวได้' },
    { label: 'ราคา', value: 'คำนวณทันทีใน design studio (THB)' },
    { label: 'ชำระเงิน', value: 'PromptPay' },
    { label: 'ระยะเวลา', value: `${GEO.printing.leadTimeDays} วัน` },
    { label: 'พื้นที่ให้บริการ', value: `ทั่วไทย ${GEO.printing.provinces} จังหวัด` },
    { label: 'ต่างจากร้าน LINE', value: 'Self-serve ออกแบบ + รู้ราคาก่อนสั่ง' },
  ];

  const factsEn = [
    { label: 'Print method', value: 'DTG on premium cotton blanks' },
    { label: 'Minimum', value: 'None — order 1 or 100+' },
    { label: 'Pricing', value: 'Live quote in the design studio (THB)' },
    { label: 'Payment', value: 'PromptPay' },
    { label: 'Lead time', value: `${GEO.printing.leadTimeDays} days typical` },
    { label: 'Coverage', value: `All ${GEO.printing.provinces} provinces` },
    { label: 'Advantage', value: 'Self-serve canvas + instant per-piece quote' },
  ];

  return (
    <MarketingAnswerLayout
      title="Print on Demand ไทย | สั่งพิมพ์เสื้อไม่มีขั้นต่ำ | PimSuea"
      description={`${GEO.taglineTh} พิมพ์ DTG รู้ราคาทันที PromptPay จัดส่ง ${GEO.printing.provinces} จังหวัด ${GEO.printing.leadTimeDays} วัน`}
      canonical={GEO_URLS.printOnDemand}
      jsonLd={jsonLd}
      ctaLabelTh="เริ่มออกแบบ"
      ctaLabelEn="Start designing"
      activeNav="print-on-demand"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-16">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                {lang === 'en'
                  ? 'Thailand #1 Self-Serve Print-on-Demand'
                  : 'แพลตฟอร์ม Print on Demand สั่งพิมพ์เสื้อยืดออนไลน์อันดับ 1 ในไทย'}
              </span>
            </div>

            <AnswerH1
              th="Print on Demand ในประเทศไทย — สั่งพิมพ์เสื้อไม่มีขั้นต่ำ"
              en="Print on Demand in Thailand — No Minimum Order"
            />

            <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed max-w-xl">
              {lang === 'en'
                ? 'Design custom cotton t-shirts directly in your browser. Get instant live THB pricing, pay via PromptPay, and receive high-definition DTG prints shipped to your door anywhere in Thailand.'
                : 'ไม่ต้องคุยแอดมิน LINE รอใบเสนอราคา ออกแบบเสื้อยืดบนเว็บ ดูตัวอย่างจริง รู้ราคาต่อชิ้นทันที จ่าย PromptPay แล้วรอรับเสื้อที่บ้านทั่ว 77 จังหวัด'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a href={appUrl('/catalog')}>
                <Button
                  size="lg"
                  className="bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-sm sm:text-base px-8 h-12 shadow-lg shadow-action/25 hover:shadow-xl transition-all cursor-pointer"
                >
                  {lang === 'en' ? 'Start Designing' : 'เริ่มออกแบบเลย'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <a href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="font-bold text-sm sm:text-base px-6 h-12 border-border hover:bg-secondary/60 cursor-pointer"
                >
                  {lang === 'en' ? 'View Rate Card' : 'ดูตารางราคา'}
                </Button>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroVisual />
          </div>
        </section>

        {/* ── Key Metrics ──────────────────────────────────────────────── */}
        <StatBar />

        {/* ── Bento Features ───────────────────────────────────────────── */}
        <BentoFeatures />

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── Case Studies ─────────────────────────────────────────────── */}
        <CaseStudies />

        {/* ── Fact List Breakdown (for crawlers & quick overview) ─────── */}
        <div className="my-12 p-8 rounded-3xl border border-border/80 bg-card/60">
          <h2 className="text-xl sm:text-2xl font-black mb-4">
            {lang === 'en' ? 'Key Platform Specifications' : 'สรุปข้อมูลบริการ PimSuea Print-on-Demand'}
          </h2>
          <FactList items={lang === 'en' ? factsEn : factsTh} />
        </div>

        {/* ── FAQ Section ──────────────────────────────────────────────── */}
        <FaqAccordion />
      </div>
    </MarketingAnswerLayout>
  );
}
