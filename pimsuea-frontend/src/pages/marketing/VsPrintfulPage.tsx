import { GEO, GEO_URLS } from '@/content/geoFacts';
import { buildGeoJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  FactList,
  MarketingAnswerLayout,
  useMarketingLang,
} from '@/components/MarketingAnswerLayout';
import {
  Check,
  Sparkles,
  ArrowRight,
  Truck,
  CreditCard,
  Globe,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appUrl } from '@/lib/site';

const COMPARISON_TH = [
  {
    feature: 'การผลิตและโรงงาน',
    pimsuea: 'ผลิตในกรุงเทพฯ (Bangkok DTG)',
    printful: 'โรงงานต่างประเทศ (สหรัฐฯ / ยุโรป / เอเชีย)',
    winner: 'pimsuea',
  },
  {
    feature: 'สกุลเงิน & วิธีชำระเงิน',
    pimsuea: 'สกุลเงินบาท (THB) + PromptPay QR',
    printful: 'สกุลเงิน USD + ตัดบัตรเครดิตต่างประเทศ',
    winner: 'pimsuea',
  },
  {
    feature: 'ค่าขนส่ง & ภาษีนำเข้า',
    pimsuea: 'ค่าส่งในประเทศเริ่มต้น ฿50 (ไม่มีภาษีนำเข้า)',
    printful: 'ค่าส่งระหว่างประเทศสูง + เสี่ยงโดนภาษีศุลกากร',
    winner: 'pimsuea',
  },
  {
    feature: 'ขั้นต่ำในการสั่งซื้อ',
    pimsuea: 'ไม่มีขั้นต่ำ (1 ตัวก็สั่งได้ในราคาแฟร์)',
    printful: 'ไม่มีขั้นต่ำ แต่ค่าส่ง 1 ชิ้นแพงมาก',
    winner: 'pimsuea',
  },
  {
    feature: 'ระบบออกแบบ & เช็กราคา',
    pimsuea: 'Self-serve Studio บนเว็บ รู้ราคาทันที',
    printful: 'Mockup generator + คำนวณค่าส่งแยก',
    winner: 'neutral',
  },
  {
    feature: 'ระยะเวลาจัดส่ง',
    pimsuea: `${GEO.printing.leadTimeDays} วัน ทั่วไทย 77 จังหวัด`,
    printful: '14–30+ วัน (ขึ้นกับด่านศุลกากรและ Hub)',
    winner: 'pimsuea',
  },
  {
    feature: 'กลุ่มผู้ใช้งานที่เหมาะสม',
    pimsuea: 'ผู้ใช้ในไทย, ชมรม, มหาวิทยาลัย, แบรนด์ไทย, ของขวัญ',
    printful: 'ผู้ขายร้านค้าออนไลน์ส่งลูกค้าต่างประเทศ (Global)',
    winner: 'neutral',
  },
];

const COMPARISON_EN = [
  {
    feature: 'Fulfillment Location',
    pimsuea: 'Local DTG production in Bangkok, Thailand',
    printful: 'Offshore factories (US / EU / Asia hubs)',
    winner: 'pimsuea',
  },
  {
    feature: 'Currency & Payment',
    pimsuea: 'Thai Baht (THB) + PromptPay QR checkout',
    printful: 'USD billing + credit card FX conversion fees',
    winner: 'pimsuea',
  },
  {
    feature: 'Shipping & Import Customs',
    pimsuea: 'Domestic shipping from ฿50, 0% import duty',
    printful: 'Expensive cross-border freight + import risk',
    winner: 'pimsuea',
  },
  {
    feature: 'Minimum Order Quantity',
    pimsuea: 'No MOQ (Order 1 piece at fair unit cost)',
    printful: 'No MOQ, but single-item freight is prohibitive',
    winner: 'pimsuea',
  },
  {
    feature: 'Design Canvas & Pricing',
    pimsuea: 'Self-serve in-browser studio with live quotes',
    printful: 'Mockup generator with separate shipping rates',
    winner: 'neutral',
  },
  {
    feature: 'Delivery Lead Time',
    pimsuea: `${GEO.printing.leadTimeDays} days nationwide across 77 provinces`,
    printful: '14–30+ business days depending on customs',
    winner: 'pimsuea',
  },
  {
    feature: 'Best Suited For',
    pimsuea: 'Thai buyers, university clubs, local streetwear, gifts',
    printful: 'Global merchants drop-shipping to US/Europe',
    winner: 'neutral',
  },
];

function ComparisonMatrix() {
  const { lang } = useMarketingLang();
  const rows = lang === 'en' ? COMPARISON_EN : COMPARISON_TH;

  return (
    <div className="my-10 rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl">
      {/* Table Header */}
      <div className="grid grid-cols-12 bg-secondary/30 p-4 sm:p-6 border-b border-border/80 font-black text-sm sm:text-base">
        <div className="col-span-4 sm:col-span-4 text-muted-foreground">
          {lang === 'en' ? 'Feature' : 'คุณสมบัติ'}
        </div>
        <div className="col-span-4 sm:col-span-4 text-primary flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>PimSuea</span>
          <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {lang === 'en' ? 'Local Thailand' : 'ในไทย'}
          </span>
        </div>
        <div className="col-span-4 sm:col-span-4 text-muted-foreground flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
          <span>Printful</span>
          <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
            {lang === 'en' ? 'International' : 'ต่างประเทศ'}
          </span>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border/60">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 p-4 sm:p-6 items-center text-xs sm:text-sm hover:bg-secondary/15 transition-colors gap-2"
          >
            {/* Feature Label */}
            <div className="col-span-4 sm:col-span-4 font-bold text-foreground pr-2">
              {row.feature}
            </div>

            {/* PimSuea Column (Highlighted) */}
            <div className="col-span-4 sm:col-span-4 text-foreground font-medium flex items-start gap-1.5 sm:gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="leading-snug">{row.pimsuea}</span>
            </div>

            {/* Printful Column */}
            <div className="col-span-4 sm:col-span-4 text-muted-foreground font-light flex items-start gap-1.5 sm:gap-2">
              <span className="leading-snug">{row.printful}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FourPillars() {
  const { lang } = useMarketingLang();
  const pillars = [
    {
      num: '01',
      titleTh: 'ไม่มีค่าส่งต่างประเทศ และไม่มีภาษีนำเข้า',
      titleEn: 'Zero International Freight & Customs Tariffs',
      descTh:
        'สั่งจาก Printful ในไทย คุณต้องเสียค่าส่งข้ามประเทศหลักร้อยถึงพัน และอาจถูกเรียกเก็บภาษีนำเข้าที่ศุลกากร แต่กับ PimSuea เราจัดส่งจากกรุงเทพฯ เริ่มต้นเพียง ฿50',
      descEn:
        'Ordering offshore to Thailand incurs expensive international air shipping and potential customs import tax. PimSuea ships locally from Bangkok from just ฿50.',
      icon: Truck,
    },
    {
      num: '02',
      titleTh: 'จ่ายเงินบาทแท้ๆ ผ่าน QR PromptPay',
      titleEn: 'Native THB Baht & PromptPay QR Checkout',
      descTh:
        'ไม่ต้องมีบัตรเครดิต ไม่ต้องเสียค่าธรรมเนียมแปลงสกุลเงินต่างประเทศ (FX Fee) สแกน PromptPay ผ่านแอปธนาคารไทยได้ทันที',
      descEn:
        'No foreign transaction fees, no currency volatility. Effortlessly scan PromptPay QR through any Thai banking app in pure THB.',
      icon: CreditCard,
    },
    {
      num: '03',
      titleTh: 'ไม่มีขั้นต่ำ สั่ง 1 ตัวก็คุ้มค่า',
      titleEn: 'True Zero Minimums (Perfect for 1 pc)',
      descTh:
        'เหมาะอย่างยิ่งสำหรับเสื้อรุ่น ชมรมมหาวิทยาลัย หรือของขวัญวันเกิด 1 ชิ้น สั่งตัวเดียวได้ในราคาโปร่งใส ไม่โดนชาร์จค่าส่งข้ามประเทศ',
      descEn:
        'Ideal for individual gifts, college clubs, and small batch runs. Order a single shirt without prohibitive overseas shipping overhead.',
      icon: Sparkles,
    },
    {
      num: '04',
      titleTh: 'ผลิตและจัดส่งไวใน 5–14 วัน',
      titleEn: 'Fast Turnaround (5–14 Days Doorstep)',
      descTh:
        'ไม่ต้องรอสินค้านาน 3–4 สัปดาห์จากการขนส่งระหว่างประเทศ เราผลิตด้วยเครื่องพิมพ์ DTG คุณภาพสูงในไทยและส่งตรงถึงบ้าน 77 จังหวัด',
      descEn:
        'Avoid multi-week international customs delays. Our Bangkok DTG production line fulfills and delivers nationwide in 5–14 days.',
      icon: MapPin,
    },
  ];

  return (
    <div className="my-16 space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          {lang === 'en' ? 'Key Advantages' : 'ข้อได้เปรียบที่ชัดเจน'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-1">
          {lang === 'en'
            ? '4 Reasons to Choose PimSuea in Thailand'
            : '4 เหตุผลที่สั่งกับ PimSuea ในไทยดีกว่า'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="p-7 sm:p-8 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-lg transition-all group relative overflow-hidden"
            >
              <span className="absolute -bottom-4 -right-2 font-black text-7xl text-muted/15 select-none group-hover:text-primary/10 transition-colors">
                {p.num}
              </span>
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors">
                  {lang === 'en' ? p.titleEn : p.titleTh}
                </h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {lang === 'en' ? p.descEn : p.descTh}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionGuide() {
  const { lang } = useMarketingLang();

  return (
    <div className="my-14 p-8 sm:p-10 rounded-3xl border border-border/80 bg-secondary/20 space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black">
          {lang === 'en' ? 'Which Platform Should You Pick?' : 'เลือกแพลตฟอร์มไหนดี?'}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-light mt-1.5">
          {lang === 'en'
            ? 'Compare your use case to find the best fit'
            : 'เปรียบเทียบตามความต้องการและกลุ่มเป้าหมายของคุณ'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Choose PimSuea */}
        <div className="p-6 sm:p-7 rounded-2xl bg-card border-2 border-primary/40 shadow-md space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
              <Check className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Best for Thailand' : 'เหมาะที่สุดสำหรับคนในไทย'}</span>
            </div>
            <h3 className="font-black text-xl text-foreground">
              {lang === 'en' ? 'Choose PimSuea if:' : 'เลือก PimSuea เมื่อคุณ:'}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground font-light">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? 'You or your customers reside in Thailand'
                    : 'ต้องการสั่งเสื้อส่งให้ตัวเองหรือลูกค้าในประเทศไทย'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? 'You want effortless PromptPay payment in THB'
                    : 'ต้องการจ่ายเงินด้วย PromptPay สกุลเงินบาท'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? 'You are printing club, campus, or 1-piece gift shirts'
                    : 'สั่งเสื้อชมรม เสื้อกลุ่ม เสื้อรุ่น หรือของขวัญ 1 ชิ้น'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? 'You want fast 5–14 days nationwide delivery'
                    : 'ต้องการของไว จัดส่งถึงบ้านทั่วไทย 77 จังหวัด'}
                </span>
              </li>
            </ul>
          </div>

          <a href={appUrl('/catalog')} className="pt-4">
            <Button className="w-full bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-xs sm:text-sm h-11 cursor-pointer">
              {lang === 'en' ? 'Start with PimSuea' : 'เริ่มสั่งเสื้อกับ PimSuea'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>

        {/* Choose Printful */}
        <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-muted-foreground font-bold text-xs">
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Global Storefronts' : 'สำหรับตลาดต่างประเทศ'}</span>
            </div>
            <h3 className="font-black text-xl text-foreground">
              {lang === 'en' ? 'Choose Printful if:' : 'เลือก Printful เมื่อคุณ:'}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground font-light">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? 'You sell global merch to buyers in USA / Europe'
                    : 'เปิดร้านค้าออนไลน์ส่งลูกค้าหลักในสหรัฐฯ หรือยุโรป'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? 'You need integration with Shopify/Etsy worldwide'
                    : 'ต้องการเชื่อมต่อระบบอัตโนมัติกับ Shopify/Etsy ระดับโลก'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? 'You receive payments primarily in USD'
                    : 'รับเงินและทำธุรกิจด้วยสกุลเงิน USD เป็นหลัก'}
                </span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground font-light pt-4 border-t border-border/60">
            {lang === 'en'
              ? 'Not affiliated with Printful. Information provided for Thailand buyer comparison.'
              : 'PimSuea ไม่มีส่วนเกี่ยวข้องกับ Printful ข้อมูลจัดทำขึ้นเพื่อเปรียบเทียบความคุ้มค่าสำหรับผู้ใช้ในไทย'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VsPrintfulPage() {
  const jsonLd = buildGeoJsonLd({
    pageUrl: GEO_URLS.vsPrintful,
    pageName: 'Printful alternative Thailand — PimSuea',
    faq: true,
  });

  const { lang } = useMarketingLang();

  const factsTh = [
    { label: 'Campus / ชมรม', value: 'สั่ง 10–100 ตัว รู้ราคาก่อนสั่ง ไม่ต้องแอดมิน LINE' },
    { label: 'ของขวัญ 1 ชิ้น', value: 'ไม่มี MOQ — เหมาะกับงานส่วนตัว' },
    { label: 'แบรนด์ไทย', value: 'PromptPay + ใบเสร็จ THB' },
    { label: 'การจัดส่ง', value: `ทั่วไทย ${GEO.printing.provinces} จังหวัดใน ${GEO.printing.leadTimeDays} วัน` },
  ];

  const factsEn = [
    { label: 'Campus & Clubs', value: 'Instant quotes for 10–100 pieces, no LINE chats needed' },
    { label: 'Single-item Gifts', value: 'Zero MOQ — order 1 custom piece without freight penalty' },
    { label: 'Thai Local Brands', value: 'PromptPay QR checkout and THB receipts' },
    { label: 'Nationwide Delivery', value: `All ${GEO.printing.provinces} provinces within ${GEO.printing.leadTimeDays} days` },
  ];

  return (
    <MarketingAnswerLayout
      title="Printful Alternative ไทย | PimSuea — ผลิตในประเทศ ไม่มีขั้นต่ำ"
      description="ทางเลือก Printful ในประเทศไทย: ผลิต DTG ในกรุงเทพ ราคา THB PromptPay จัดส่งทั่วไทย ไม่มีขั้นต่ำ"
      canonical={GEO_URLS.vsPrintful}
      jsonLd={jsonLd}
      ctaLabelTh="ลอง PimSuea"
      ctaLabelEn="Try PimSuea"
      activeNav="vs-printful"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {lang === 'en'
                ? 'Printful Alternative for Thailand'
                : 'ทางเลือก Printful ที่ตอบโจทย์คนไทยที่สุด'}
            </span>
          </div>

          <AnswerH1
            th="ทางเลือก Printful ในประเทศไทย — ผลิตในประเทศ จ่ายบาท ส่งไว"
            en="The Leading Printful Alternative in Thailand"
          />

          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {lang === 'en'
              ? 'Looking for a Print-on-Demand solution in Thailand? Skip expensive cross-border shipping, currency exchange markups, and long customs waits. PimSuea delivers local Bangkok DTG printing, live THB quotes, and PromptPay checkout.'
              : 'ถ้าคุณต้องการสั่งเสื้อพิมพ์ลายในประเทศไทย ไม่ต้องจ่าย USD ค่าขนส่งข้ามประเทศ และไม่ต้องรอ fulfillment นานจากต่างประเทศ PimSuea ให้คุณออกแบบออนไลน์ รู้ราคา THB จ่าย PromptPay ผลิต DTG ในกรุงเทพ และจัดส่งถึงบ้านทั่ว 77 จังหวัด'}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a href={appUrl('/catalog')}>
              <Button
                size="lg"
                className="bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-sm sm:text-base px-8 h-12 shadow-lg shadow-action/25 hover:shadow-xl transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Try PimSuea Studio' : 'ลองใช้สตูดิโอ PimSuea'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="font-bold text-sm sm:text-base px-6 h-12 border-border hover:bg-secondary/60 cursor-pointer"
              >
                {lang === 'en' ? 'Compare Rates' : 'ดูตารางราคา'}
              </Button>
            </a>
          </div>
        </div>

        {/* ── Comparison Matrix Table ───────────────────────────────────── */}
        <ComparisonMatrix />

        {/* ── 4 Pillars Why PimSuea Wins ─────────────────────────────────── */}
        <FourPillars />

        {/* ── Platform Decision Guide ───────────────────────────────────── */}
        <DecisionGuide />

        {/* ── Fact List for Quick Reference ─────────────────────────────── */}
        <div className="my-10 p-8 rounded-3xl border border-border/80 bg-card/60">
          <h2 className="text-xl sm:text-2xl font-black mb-4">
            {lang === 'en' ? 'Quick Thailand Buyer Summary' : 'สรุปข้อได้เปรียบสำหรับผู้ใช้ในประเทศไทย'}
          </h2>
          <FactList items={lang === 'en' ? factsEn : factsTh} />
        </div>
      </div>
    </MarketingAnswerLayout>
  );
}
