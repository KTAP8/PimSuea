import { useState, useMemo } from 'react';
import {
  DELIVERY_FEE_TIERS,
  DTG_PRINT_QTY1_11,
  EXAMPLE_STARTING_PRICE_THB,
  GARMENT_PRICING,
  GEO,
  GEO_URLS,
} from '@/content/geoFacts';
import { buildGeoJsonLd, buildPricingOfferJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  MarketingAnswerLayout,
  useMarketingLang,
} from '@/components/MarketingAnswerLayout';
import {
  Calculator,
  Sparkles,
  Zap,
  Truck,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appUrl } from '@/lib/site';

/** Interactive Real-Time Price Estimator */
function PriceCalculatorWidget() {
  const { lang } = useMarketingLang();

  // Selection states
  const [selectedGarmentIdx, setSelectedGarmentIdx] = useState(0);
  const [selectedColorKey, setSelectedColorKey] = useState<'White' | 'Other'>('White');
  const [selectedPrintTier, setSelectedPrintTier] = useState<'3x4in' | 'A5' | 'A4' | 'A3'>('3x4in');
  const [qty, setQty] = useState(1);

  const garment = GARMENT_PRICING[selectedGarmentIdx];
  const garmentColorObj = garment.colors.find((c) => c.key === selectedColorKey) || garment.colors[0];
  const garmentPrice = garmentColorObj.thb;

  const printTiersList = selectedColorKey === 'White' ? DTG_PRINT_QTY1_11.white : DTG_PRINT_QTY1_11.other;
  const activePrintObj = printTiersList.find((p) => p.code === selectedPrintTier) || printTiersList[0];
  const printPrice = activePrintObj.thb;

  // Delivery calculation
  const deliveryFee = useMemo(() => {
    if (qty <= 5) return 50;
    return 100;
  }, [qty]);

  const unitTotal = garmentPrice + printPrice;
  const subtotal = unitTotal * qty;
  const grandTotal = subtotal + deliveryFee;

  const printSizesInfo = [
    { code: '3x4in', name: '3×4" (Chest Logo)', nameTh: '3×4 นิ้ว (โลโก้อก)', desc: 'Pocket / Logo' },
    { code: 'A5', name: 'A5 (Mid Graphic)', nameTh: 'A5 (ลายขนาดกลาง)', desc: '14.8 × 21 cm' },
    { code: 'A4', name: 'A4 (Standard Front)', nameTh: 'A4 (ขนาดมาตรฐาน)', desc: '21 × 29.7 cm' },
    { code: 'A3', name: 'A3 (Oversized Graphic)', nameTh: 'A3 (ลายเต็มตัว)', desc: '29.7 × 42 cm' },
  ] as const;

  return (
    <div className="my-10 p-6 sm:p-8 md:p-10 rounded-3xl border-2 border-primary/20 bg-linear-to-b from-card via-card to-secondary/20 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[90px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              {lang === 'en' ? 'Live Instant Price Estimator' : 'คำนวณราคาพิมพ์เสื้อแบบเรียลไทม์'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-light">
              {lang === 'en'
                ? 'Test garment, print size, and quantity live'
                : 'ทดลองเลือกแบบเสื้อ ขนาดลายสกรีน และจำนวนชิ้น'}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-action/10 text-action font-black text-xs self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{lang === 'en' ? 'Live Rate' : 'ราคาสด'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left: Interactive Selectors */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Garment Style */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span>1. {lang === 'en' ? 'Choose Garment Style' : 'เลือกทรงเสื้อ'}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GARMENT_PRICING.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedGarmentIdx(idx)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedGarmentIdx === idx
                      ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
                      : 'border-border/80 bg-card hover:bg-secondary/40'
                  }`}
                >
                  <span className="font-bold text-sm text-foreground">
                    {lang === 'en' ? g.nameEn : g.nameTh}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {lang === 'en' ? `Size: ${g.sizeNote}` : `ไซส์: ${g.sizeNote}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Shirt Color */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. {lang === 'en' ? 'Shirt Color' : 'สีเสื้อ'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedColorKey('White')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  selectedColorKey === 'White'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                    : 'border-border/80 bg-card hover:bg-secondary/40'
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-border bg-white shadow-xs" />
                <span className="font-bold text-sm text-foreground">
                  {lang === 'en' ? 'White Tee' : 'เสื้อสีขาว'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedColorKey('Other')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  selectedColorKey === 'Other'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                    : 'border-border/80 bg-card hover:bg-secondary/40'
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-border bg-stone-900 shadow-xs" />
                <span className="font-bold text-sm text-foreground">
                  {lang === 'en' ? 'Other Colors' : 'เสื้อสีอื่น / สีเข้ม'}
                </span>
              </button>
            </div>
          </div>

          {/* Step 3: Print Size Tier */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>3. {lang === 'en' ? 'DTG Print Size' : 'ขนาดลายสกรีน DTG'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {printSizesInfo.map((p) => {
                const tierCost =
                  (selectedColorKey === 'White' ? DTG_PRINT_QTY1_11.white : DTG_PRINT_QTY1_11.other).find(
                    (t) => t.code === p.code
                  )?.thb || 0;

                const isSelected = selectedPrintTier === p.code;
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setSelectedPrintTier(p.code as any)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs'
                        : 'border-border/80 bg-card hover:bg-secondary/40'
                    }`}
                  >
                    <span className="font-black text-sm text-foreground">{p.code === '3x4in' ? '3×4"' : p.code}</span>
                    <span className="text-[11px] text-muted-foreground my-0.5">{p.desc}</span>
                    <span className="text-xs font-bold text-primary">฿{tierCost}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Quantity */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                4. {lang === 'en' ? 'Quantity (Pieces)' : 'จำนวนเสื้อ (ชิ้น)'}
              </label>
              <span className="font-black text-sm text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                {qty} {lang === 'en' ? (qty === 1 ? 'piece' : 'pieces') : 'ตัว'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="50"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-action"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                {[1, 5, 12, 20, 50].map((quickQty) => (
                  <button
                    key={quickQty}
                    type="button"
                    onClick={() => setQty(quickQty)}
                    className={`px-2 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                      qty === quickQty
                        ? 'bg-action text-action-foreground shadow-xs'
                        : 'bg-secondary/70 hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {quickQty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Quote Summary Card */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/80 shadow-lg space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {lang === 'en' ? 'Quote Breakdown' : 'สรุปประมาณการราคา'}
            </span>
            <div className="mt-3 space-y-3 divide-y divide-border/60 text-sm">
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground font-light">
                  {lang === 'en' ? garment.nameEn : garment.nameTh} ({selectedColorKey})
                </span>
                <span className="font-semibold text-foreground">฿{garmentPrice} / pc</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground font-light">
                  {lang === 'en' ? `DTG Print (${activePrintObj.tier})` : `พิมพ์ DTG (${activePrintObj.tier})`}
                </span>
                <span className="font-semibold text-foreground">฿{printPrice} / pc</span>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-foreground">
                <span>{lang === 'en' ? 'Cost per shirt' : 'ราคารวมต่อตัว'}</span>
                <span className="text-base text-primary">฿{unitTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground font-light">
                  {lang === 'en' ? `Shirts Subtotal (${qty} pcs)` : `รวมค่าเสื้อ (${qty} ตัว)`}
                </span>
                <span className="font-bold text-foreground">฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground font-light">
                  {lang === 'en' ? 'Doorstep Delivery' : 'ค่าจัดส่งถึงบ้าน'}
                </span>
                <span className="font-bold text-foreground">฿{deliveryFee}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-sm text-foreground">
                {lang === 'en' ? 'Estimated Total' : 'ยอดรวมสุทธิ'}
              </span>
              <div className="text-right">
                <span className="text-3xl font-black text-action">฿{grandTotal.toLocaleString()}</span>
                <p className="text-[10px] text-muted-foreground">PromptPay / THB</p>
              </div>
            </div>

            <a href={appUrl('/catalog')} className="block">
              <Button
                size="lg"
                className="w-full bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-sm h-11 shadow-md shadow-action/20 transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Design This Shirt' : 'เปิดสตูดิโอสั่งลายนี้'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function RateCards() {
  const { lang } = useMarketingLang();

  return (
    <div className="space-y-12 my-12">
      {/* 1. Garment Blank Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {lang === 'en' ? 'Garment Catalog' : 'ประเภทเสื้อและเนื้อผ้า'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">
              {lang === 'en' ? '1. Garment Base Pricing' : '1. ตารางราคาเสื้อเปล่า (Garment)'}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-light">
            {lang === 'en' ? 'High quality 100% combed cotton' : 'เนื้อผ้า Cotton 100% คุณภาพพรีเมียม'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GARMENT_PRICING.map((g, i) => (
            <div
              key={i}
              className="p-6 sm:p-7 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-black text-xl text-foreground">
                    {lang === 'en' ? g.nameEn : g.nameTh}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-bold">
                    {g.sizeNote}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-light">
                  {lang === 'en' ? `Tier: ${g.qtyLabel}` : `เรตจำนวน: ${g.qtyLabel}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/60">
                {g.colors.map((c) => (
                  <div
                    key={c.key}
                    className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border border-border/80 ${
                          c.key === 'White' ? 'bg-white' : 'bg-stone-900'
                        }`}
                      />
                      <span className="font-bold text-xs">
                        {lang === 'en' ? c.labelEn : c.labelTh}
                      </span>
                    </div>
                    <span className="font-black text-sm text-primary">฿{c.thb}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. DTG Print Pricing */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {lang === 'en' ? 'Direct-to-Garment' : 'ค่าบริการพิมพ์ลาย'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">
              {lang === 'en' ? '2. DTG Print Tier Pricing' : '2. ตารางค่าพิมพ์ DTG ตามขนาด'}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-light">
            {lang === 'en' ? 'Qty bracket 1–11 pcs (Volume discounts in studio)' : 'เรต 1–11 ชิ้น (มีส่วนลดเพิ่มเมื่อสั่งจำนวนมาก)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* White garment print table */}
          <div className="p-6 sm:p-7 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <div className="w-3.5 h-3.5 rounded-full border border-border bg-white" />
              <h3 className="font-black text-lg text-foreground">
                {lang === 'en' ? 'On White Garment (1–11 pcs)' : 'พิมพ์บนเสื้อสีขาว (1–11 ชิ้น)'}
              </h3>
            </div>
            <div className="space-y-2.5">
              {DTG_PRINT_QTY1_11.white.map((row) => (
                <div
                  key={row.code}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">{row.tier}</span>
                  </div>
                  <span className="font-black text-sm text-primary">฿{row.thb} / pc</span>
                </div>
              ))}
            </div>
          </div>

          {/* Other color garment print table */}
          <div className="p-6 sm:p-7 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <div className="w-3.5 h-3.5 rounded-full border border-border bg-stone-900" />
              <h3 className="font-black text-lg text-foreground">
                {lang === 'en' ? 'On Other Colors / Dark (1–11 pcs)' : 'พิมพ์บนเสื้อสีอื่น / สีเข้ม (1–11 ชิ้น)'}
              </h3>
            </div>
            <div className="space-y-2.5">
              {DTG_PRINT_QTY1_11.other.map((row) => (
                <div
                  key={row.code}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">{row.tier}</span>
                  </div>
                  <span className="font-black text-sm text-primary">฿{row.thb} / pc</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Delivery Fee Tiers */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {lang === 'en' ? 'Nationwide Shipping' : 'ค่าบริการจัดส่ง'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">
            {lang === 'en' ? '3. Doorstep Delivery Fees' : '3. ตารางค่าจัดส่งทั่วประเทศ'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DELIVERY_FEE_TIERS.map((tier, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <span className="font-black text-lg text-action">฿{tier.thb}</span>
              </div>
              <div className="mt-4">
                <p className="font-bold text-sm text-foreground">
                  {lang === 'en' ? tier.labelEn : tier.label}
                </p>
                <p className="text-xs text-muted-foreground font-light mt-0.5">
                  {lang === 'en' ? 'All 77 provinces across Thailand' : 'ครอบคลุม 77 จังหวัดทั่วไทย'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ValueHighlights() {
  const { lang } = useMarketingLang();
  const points = [
    {
      titleTh: 'ไม่มีค่าเปิดบล็อกสกรีน ฿0',
      titleEn: '฿0 Screen Setup Fees',
      descTh: 'เทคนิค DTG ไม่ต้องทำบล็อกแม่พิมพ์ สั่ง 1 ตัวจึงประหยัดกว่าร้านสกรีนบล็อกแบบเดิมมหาศาล',
      descEn: 'Digital DTG requires zero physical screens or films, eliminating costly upfront setup charges.',
    },
    {
      titleTh: 'สั่ง 1 ตัว หรือ 100 ตัว ก็ได้ราคาแฟร์',
      titleEn: 'Fair Pricing From 1 Piece',
      descTh: 'ไม่ต้องกังวลเรื่องขั้นต่ำ สั่งตัวเดียวได้ในราคาสมเหตุสมผล และมีส่วนลดเพิ่มเมื่อสั่งจำนวนมาก',
      descEn: 'No penalty for single pieces, with seamless tiered discounts unlocking automatically for bulk orders.',
    },
    {
      titleTh: 'ราคาโปร่งใส ชำระผ่าน PromptPay',
      titleEn: '100% Transparent PromptPay Checkout',
      descTh: 'เห็นยอดรวมสุทธิทุกรายการก่อนยืนยันสั่งซื้อ ไม่มีค่าบริการแอบแฝง จ่ายง่ายผ่าน QR PromptPay',
      descEn: 'Clear breakdown with zero hidden fees. Effortless checkout in Thai Baht via standard PromptPay QR.',
    },
  ];

  return (
    <div className="my-12 p-8 rounded-3xl border border-border/80 bg-secondary/20">
      <h2 className="text-2xl sm:text-3xl font-black mb-6 text-center">
        {lang === 'en' ? 'Why PimSuea Pricing is Unbeatable' : 'ทำไมราคาของ PimSuea ถึงคุ้มค่ากว่า'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {points.map((p, i) => (
          <div key={i} className="p-6 rounded-2xl bg-card border border-border/70 shadow-xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              0{i + 1}
            </div>
            <h3 className="font-bold text-base text-foreground">
              {lang === 'en' ? p.titleEn : p.titleTh}
            </h3>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              {lang === 'en' ? p.descEn : p.descTh}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const jsonLd = [
    buildGeoJsonLd({
      pageUrl: GEO_URLS.pricing,
      pageName: 'DTG t-shirt pricing Thailand — PimSuea',
      faq: false,
    }),
    buildPricingOfferJsonLd(),
  ];

  const { lang } = useMarketingLang();
  const snapshotNote = `ข้อมูลอ้างอิงจากฐานข้อมูล ณ ${GEO.pricingSnapshotDate} — ราคาสุทธิคำนวณตามขนาดและจำนวนจริงในสตูดิโอ`;

  return (
    <MarketingAnswerLayout
      title="ราคาพิมพ์เสื้อ DTG | ตารางราคา PimSuea"
      description="ตารางราคาเสื้อ + พิมพ์ DTG (3×4 / A5 / A4 / A3) และค่าจัดส่งตามจำนวน — จากระบบ PimSuea จริง"
      canonical={GEO_URLS.pricing}
      jsonLd={jsonLd}
      ctaLabelTh="ดูราคาสด"
      ctaLabelEn="See live pricing"
      activeNav="pricing"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {lang === 'en'
                ? `Updated Rate Snapshot: ${GEO.pricingSnapshotDate}`
                : `ตารางราคาอย่างเป็นทางการ อัปเดตล่าสุด ${GEO.pricingSnapshotDate}`}
            </span>
          </div>

          <AnswerH1
            th="ราคาพิมพ์เสื้อ DTG — ตารางราคาสาธารณะและคำนวณราคาสด"
            en="DTG T-Shirt Printing Rates — Public Pricing Snapshot"
          />

          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {lang === 'en'
              ? 'Transparent DTG pricing in THB with zero hidden setup fees. Test your custom shirt configuration with our live calculator or inspect our public rate cards below.'
              : 'โปร่งใส ชัดเจน ไม่มีค่าเปิดบล็อกแอบแฝง คำนวณราคาเสื้อและค่าพิมพ์ DTG ได้แบบเรียลไทม์ผ่านตัวคำนวณ หรือตรวจสอบตารางราคาทั้งหมดด้านล่าง'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-border text-sm font-medium">
              <span>{lang === 'en' ? 'Starting price (White tee + 3×4" print):' : 'ราคาเริ่มต้น (เสื้อยืดขาว + สกรีน 3×4"): '}</span>
              <strong className="text-primary font-black">~฿{EXAMPLE_STARTING_PRICE_THB.toLocaleString()} / {lang === 'en' ? 'pc' : 'ชิ้น'}</strong>
            </div>
            <p className="text-xs text-muted-foreground font-light">{snapshotNote}</p>
          </div>
        </div>

        {/* ── Interactive Live Price Calculator ─────────────────────────── */}
        <PriceCalculatorWidget />

        {/* ── Structured Rate Cards & Tables ───────────────────────────── */}
        <RateCards />

        {/* ── Value Highlights ─────────────────────────────────────────── */}
        <ValueHighlights />
      </div>
    </MarketingAnswerLayout>
  );
}
