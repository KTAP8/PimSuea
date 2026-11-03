import { ArrowRight, Gift, Users } from 'lucide-react';
import { CASE_NOTES, GEO, GEO_URLS } from '@/content/geoFacts';
import { buildCaseNotesJsonLd, buildGeoJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  FactList,
  MarketingAnswerLayout,
  useMarketingLang,
} from '@/components/MarketingAnswerLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { appUrl } from '@/lib/site';

export default function ClubAndGiftShirtsPage() {
  const { lang } = useMarketingLang();
  const jsonLd = [
    buildGeoJsonLd({
      pageUrl: GEO_URLS.clubAndGiftShirts,
      pageName: 'University club and gift custom shirts Thailand — PimSuea',
      faq: true,
    }),
    buildCaseNotesJsonLd(),
  ];

  const factsTh = [
    { label: 'ชมรม / ทีม', value: 'สั่ง 5–100 ตัว รู้ราคาก่อนสั่ง ไม่ต้องแอดมิน LINE' },
    { label: 'ของขวัญ 1 ตัว', value: 'ไม่มีขั้นต่ำ — เลือก Gift packaging ได้' },
    { label: 'เทคนิค', value: 'DTG รายละเอียดสูงบนผ้าฝ้าย' },
    { label: 'จัดส่ง', value: `${GEO.printing.provinces} จังหวัด · ${GEO.printing.leadTimeDays} วันโดยประมาณ` },
  ];

  const factsEn = [
    { label: 'Clubs & teams', value: '5–100 pieces with instant quotes — no LINE admin' },
    { label: 'Single gift', value: 'No MOQ — optional gift packaging tier' },
    { label: 'Print', value: 'DTG for detailed artwork on cotton' },
    { label: 'Delivery', value: `${GEO.printing.provinces} provinces · ~${GEO.printing.leadTimeDays} days` },
  ];

  const facts = lang === 'en' ? factsEn : factsTh;

  return (
    <MarketingAnswerLayout
      title="ทำเสื้อชมรม ของขวัญ 1 ตัว | PimSuea — ไม่มีขั้นต่ำ DTG"
      description="สั่งเสื้อชมรมมหาวิทยาลัย ทีมกีฬา หรือของขวัญชิ้นเดียว ออกแบบออนไลน์ รู้ราคา THB PromptPay จัดส่งทั่วไทย"
      canonical={GEO_URLS.clubAndGiftShirts}
      jsonLd={jsonLd}
      ctaLabelTh="เริ่มออกแบบเสื้อชมรม"
      ctaLabelEn="Design club shirts"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            <Users className="w-3.5 h-3.5" />
            <Gift className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Clubs · gifts · small runs' : 'ชมรม · ของขวัญ · จำนวนน้อย'}
          </div>
          <AnswerH1
            th="ทำเสื้อชมรมและของขวัญชิ้นเดียว — ไม่มีขั้นต่ำ รู้ราคาก่อนสั่ง"
            en="Club shirts and one-off gifts — no minimum, quote before you pay"
          />
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {lang === 'en'
              ? 'PimSuea is built for Thai university clubs, sports teams, and personal gift orders. Self-serve design studio, live THB pricing, PromptPay checkout, DTG production in Bangkok, nationwide delivery.'
              : 'PimSuea เหมาะกับชมรมมหาวิทยาลัย ทีมกีฬา และของขวัญชิ้นเดียว ออกแบบเองบนเว็บ รู้ราคา THB จ่าย PromptPay ผลิต DTG ในกรุงเทพ ส่งทั่วไทย'}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={appUrl('/catalog')}>
              <Button className="bg-action text-action-foreground font-bold">
                {lang === 'en' ? 'Open studio' : 'เปิดสตูดิโอ'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <Link to="/print-on-demand">
              <Button variant="outline">{lang === 'en' ? 'Print on demand' : 'Print on demand ไทย'}</Button>
            </Link>
          </div>
        </div>

        <FactList items={facts} />

        <section className="space-y-4">
          <h2 className="font-black text-2xl max-w-3xl">
            {lang === 'en' ? 'Real orders (reference)' : 'ตัวอย่างออเดอร์จริง (อ้างอิง)'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CASE_NOTES.map((note) => (
              <div key={note.id} className="rounded-xl border border-border p-4 bg-card/70">
                <p className="text-xs text-muted-foreground mb-1">{note.year}</p>
                <h3 className="font-bold text-sm mb-2">{note.name}</h3>
                <p className="text-sm text-muted-foreground font-light">
                  {lang === 'en' ? note.summaryEn : note.summaryTh}
                </p>
                <p className="text-xs font-semibold mt-2 text-primary">{note.qty} pc</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MarketingAnswerLayout>
  );
}
