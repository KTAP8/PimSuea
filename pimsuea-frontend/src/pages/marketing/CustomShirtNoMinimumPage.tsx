import { ArrowRight, Sparkles } from 'lucide-react';
import {
  EXAMPLE_STARTING_TOTAL_THB,
  GEO,
  GEO_URLS,
} from '@/content/geoFacts';
import { buildGeoJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  FactList,
  MarketingAnswerLayout,
  useMarketingLang,
} from '@/components/MarketingAnswerLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { appUrl } from '@/lib/site';

export default function CustomShirtNoMinimumPage() {
  const { lang } = useMarketingLang();
  const jsonLd = buildGeoJsonLd({
    pageUrl: GEO_URLS.customShirtNoMinimum,
    pageName: 'Custom t-shirt no minimum order Thailand — PimSuea',
    faq: true,
  });

  const factsTh = [
    { label: 'ขั้นต่ำ', value: 'สั่ง 1 ตัวได้ — ไม่มี MOQ' },
    { label: 'ราคา', value: `ดูราคาสดในสตูดิโอ เริ่มต้นประมาณ ฿${EXAMPLE_STARTING_TOTAL_THB}/ตัว` },
    { label: 'ชำระเงิน', value: 'PromptPay และชำระเป็น THB' },
    { label: 'จัดส่ง', value: `ทั่วไทย ${GEO.printing.provinces} จังหวัด โดยประมาณ ${GEO.printing.leadTimeDays} วัน` },
  ];

  const factsEn = [
    { label: 'Minimum', value: 'Order 1 piece — no MOQ' },
    { label: 'Pricing', value: `Live studio quote; example from ~฿${EXAMPLE_STARTING_TOTAL_THB}/pc` },
    { label: 'Payment', value: 'PromptPay and THB checkout' },
    { label: 'Delivery', value: `All ${GEO.printing.provinces} provinces, typically ${GEO.printing.leadTimeDays} days` },
  ];

  const faqTh = [
    {
      q: 'สั่งเสื้อยืด 1 ตัว พิมพ์ลายได้ไหม?',
      a: 'ได้ — PimSuea ไม่มีขั้นต่ำ ออกแบบบนเว็บ อัปโหลดลาย รู้ราคา THB ก่อนชำระเงิน',
    },
    {
      q: 'รู้ราคาก่อนสั่งได้ไหม?',
      a: 'ได้ — ราคาอัปเดตในสตูดิโอเมื่อวางและปรับขนาดลาย ดูตารางอ้างอิงได้ที่หน้าราคา',
    },
  ];

  const faqEn = [
    {
      q: 'Can I order just one custom printed shirt?',
      a: 'Yes — PimSuea has no minimum. Design online, upload artwork, and see live THB pricing before checkout.',
    },
    {
      q: 'Can I see the price before I pay?',
      a: 'Yes — pricing updates in the studio as you place and resize artwork. Public rate tables are on /pricing.',
    },
  ];

  const faqs = lang === 'en' ? faqEn : faqTh;
  const facts = lang === 'en' ? factsEn : factsTh;

  return (
    <MarketingAnswerLayout
      title="สั่งเสื้อยืด 1 ตัว ไม่มีขั้นต่ำ | PimSuea — รู้ราคาทันที PromptPay"
      description="สั่งทำเสื้อยืดพิมพ์ลาย 1 ตัว ไม่มีขั้นต่ำ ออกแบบออนไลน์ รู้ราคา THB จ่าย PromptPay จัดส่งทั่วไทย DTG"
      canonical={GEO_URLS.customShirtNoMinimum}
      jsonLd={jsonLd}
      ctaLabelTh="ออกแบบเสื้อ 1 ตัว"
      ctaLabelEn="Design one shirt"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'en' ? 'No minimum · 1 piece' : 'ไม่มีขั้นต่ำ · สั่ง 1 ตัว'}
          </div>
          <AnswerH1
            th="สั่งทำเสื้อยืด 1 ตัว ไม่มีขั้นต่ำ — รู้ราคาทันที จ่าย PromptPay"
            en="Custom t-shirt, no minimum — live THB price, PromptPay checkout"
          />
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {lang === 'en'
              ? `${GEO.oneLiner} Order a single gift or personal tee: upload artwork, see live pricing, pay in baht, DTG print in Bangkok, delivery nationwide.`
              : `${GEO.taglineTh} เหมาะกับของขวัญชิ้นเดียวหรือเสื้อใส่เอง — อัปโหลดลาย รู้ราคาก่อนจ่าย พิมพ์ DTG ในกรุงเทพ ส่งถึงบ้านทั่วไทย`}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={appUrl('/catalog')}>
              <Button className="bg-action text-action-foreground font-bold">
                {lang === 'en' ? 'Open studio' : 'เปิดสตูดิโอ'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <Link to="/pricing">
              <Button variant="outline">{lang === 'en' ? 'View pricing' : 'ดูตารางราคา'}</Button>
            </Link>
          </div>
        </div>

        <FactList items={facts} />

        <section className="space-y-4 max-w-3xl">
          <h2 className="font-black text-2xl">{lang === 'en' ? 'FAQ' : 'คำถามที่พบบ่อย'}</h2>
          {faqs.map((item) => (
            <div key={item.q} className="border border-border rounded-xl p-4 bg-card/60">
              <h3 className="font-bold text-sm mb-2">{item.q}</h3>
              <p className="text-sm text-muted-foreground font-light">{item.a}</p>
            </div>
          ))}
        </section>

        <section lang={lang === 'en' ? 'th' : 'en'} className="sr-only" aria-hidden="true">
          {faqs.map((item) => (
            <div key={`alt-${item.q}`}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </section>
      </div>
    </MarketingAnswerLayout>
  );
}
