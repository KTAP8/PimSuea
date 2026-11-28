import { ArrowRight, Gift, Users } from 'lucide-react';
import { CASE_NOTES, GEO, GEO_URLS } from '@/content/geoFacts';
import { buildCaseNotesJsonLd, buildGeoJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  FactList,
  MarketingAnswerLayout,
  useMarketingLang,
} from '@/components/MarketingAnswerLayout';
import { FaqList } from '@/components/marketing/FaqList';
import { Button } from '@/components/ui/button';
import { LocalizedLink } from '@/components/LocalizedLink';
import { studioUrl } from '@/lib/site';

const FACTS = {
  en: [
    { label: 'Clubs & communities', value: 'Run, ice bath, Muay Thai, hash, padel, football — 5 to 100+ pieces' },
    { label: 'Couples & families', value: 'Matching shirts and single gifts — no minimum, gift box add-on' },
    { label: 'Price', value: 'Live THB quote in the studio before you pay — card or PromptPay' },
    { label: 'Support', value: 'English and Thai on LINE' },
    { label: 'Print', value: 'DTG for detailed artwork on cotton, printed in Bangkok' },
    { label: 'Delivery', value: `${GEO.printing.provinces} provinces · ~${GEO.printing.leadTimeDays} days` },
  ],
  th: [
    { label: 'ชมรม / คอมมูนิตี้', value: 'ก๊วนวิ่ง ไอซ์บาธ มวยไทย พาเดล ฟุตบอล — 5 ถึง 100+ ตัว' },
    { label: 'คู่รัก / ครอบครัว', value: 'เสื้อคู่ เสื้อครอบครัว ของขวัญชิ้นเดียว — ไม่มีขั้นต่ำ เพิ่มกล่องของขวัญได้' },
    { label: 'ราคา', value: 'รู้ราคา THB ในสตูดิโอก่อนจ่าย — บัตรหรือ PromptPay' },
    { label: 'ซัพพอร์ต', value: 'ภาษาไทยและอังกฤษทาง LINE' },
    { label: 'เทคนิค', value: 'DTG รายละเอียดสูงบนผ้าฝ้าย ผลิตในกรุงเทพ' },
    { label: 'จัดส่ง', value: `${GEO.printing.provinces} จังหวัด · ${GEO.printing.leadTimeDays} วันโดยประมาณ` },
  ],
};

const FAQ = {
  en: [
    {
      q: 'Our run club has 15 members. Is that too small?',
      a: 'No. There is no minimum order — 15 shirts are priced and produced the same way as 1 or 100. Each member can pick their own size.',
    },
    {
      q: 'Can I make matching shirts for a family trip or wedding?',
      a: 'Yes. Design once, order in the sizes you need, and add the gift box service at checkout if it is a present.',
    },
    {
      q: 'Can someone who does not read Thai order for the group?',
      a: 'Yes. The studio and checkout are in English, and our team answers in English on LINE.',
    },
  ],
  th: [
    {
      q: 'ก๊วนวิ่งมีสมาชิก 15 คน น้อยไปไหม?',
      a: 'ไม่น้อยเลย ไม่มีขั้นต่ำ 15 ตัวคิดราคาและผลิตแบบเดียวกับ 1 หรือ 100 ตัว เลือกไซส์แยกแต่ละคนได้',
    },
    {
      q: 'ทำเสื้อครอบครัวสำหรับทริปหรืองานแต่งได้ไหม?',
      a: 'ได้ ออกแบบครั้งเดียว สั่งไซส์ที่ต้องการ และเพิ่มบริการกล่องของขวัญตอนชำระเงินได้',
    },
  ],
};

export default function ClubAndGiftShirtsPage() {
  const { lang } = useMarketingLang();
  const jsonLd = [
    buildGeoJsonLd({
      lang,
      pageUrl: GEO_URLS.clubAndGiftShirts,
      pageName: 'Club, community and gift custom shirts in Thailand — PimSuea',
      faq: true,
    }),
    buildCaseNotesJsonLd(),
  ];
  const en = lang === 'en';

  return (
    <MarketingAnswerLayout
      title={{
        en: 'Custom Club & Community Shirts in Thailand — Run Clubs, Teams, Family Gifts | PimSuea',
        th: 'ทำเสื้อชมรม เสื้อทีม เสื้อครอบครัว และของขวัญ | PimSuea — ไม่มีขั้นต่ำ DTG',
      }}
      description={{
        en: 'Custom shirts for run clubs, ice bath groups, Muay Thai gyms, sports teams, communities, and family gifts in Thailand. No minimum, live THB price, English support, nationwide delivery.',
        th: 'สั่งเสื้อชมรม ก๊วนวิ่ง ทีมกีฬา คอมมูนิตี้ เสื้อครอบครัว หรือของขวัญชิ้นเดียว ออกแบบออนไลน์ รู้ราคา THB จ่ายบัตรหรือ PromptPay จัดส่งทั่วไทย',
      }}
      canonical={GEO_URLS.clubAndGiftShirts}
      jsonLd={jsonLd}
      ctaLabelTh="เริ่มออกแบบเสื้อทีม"
      ctaLabelEn="Design club shirts"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            <Users className="w-3.5 h-3.5" />
            <Gift className="w-3.5 h-3.5" />
            {en ? 'Clubs · communities · family gifts' : 'ชมรม · คอมมูนิตี้ · ของขวัญครอบครัว'}
          </div>
          <AnswerH1
            th="เสื้อชมรม เสื้อทีม และของขวัญครอบครัว — ไม่มีขั้นต่ำ รู้ราคาก่อนสั่ง"
            en="Shirts for your club, community, or family — no minimum, price up front"
          />
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {en
              ? 'PimSuea makes custom shirts for run clubs, ice bath and breathwork groups, Muay Thai gyms, hash runs, padel and football teams, community meetups, and couples or families celebrating together. Design in English, see the THB price instantly, pay by card or PromptPay, and get DTG prints from Bangkok delivered anywhere in Thailand.'
              : 'PimSuea ทำเสื้อสำหรับก๊วนวิ่ง กลุ่มไอซ์บาธ ค่ายมวย ทีมพาเดลและฟุตบอล คอมมูนิตี้ และคู่รักหรือครอบครัวที่อยากมีเสื้อเหมือนกัน ออกแบบเองบนเว็บ รู้ราคา THB จ่ายบัตรหรือ PromptPay ผลิต DTG ในกรุงเทพ ส่งทั่วไทย'}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={studioUrl()}>
              <Button className="bg-action text-action-foreground font-bold">
                {en ? 'Open studio' : 'เปิดสตูดิโอ'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <LocalizedLink to="/custom-shirts-thailand">
              <Button variant="outline">{en ? 'Custom shirts in Thailand' : 'สั่งทำเสื้อในไทย'}</Button>
            </LocalizedLink>
          </div>
        </div>

        <FactList items={FACTS[lang]} />

        <section className="space-y-4">
          <h2 className="font-black text-2xl max-w-3xl">
            {en ? 'Real orders (reference)' : 'ตัวอย่างออเดอร์จริง (อ้างอิง)'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CASE_NOTES.map((note) => (
              <div key={note.id} className="rounded-xl border border-border p-4 bg-card/70">
                <p className="text-xs text-muted-foreground mb-1">{note.year}</p>
                <h3 className="font-bold text-sm mb-2">{note.name}</h3>
                <p className="text-sm text-muted-foreground font-light">
                  {en ? note.summaryEn : note.summaryTh}
                </p>
                <p className="text-xs font-semibold mt-2 text-primary">{note.qty} pc</p>
              </div>
            ))}
          </div>
        </section>

        <FaqList title={en ? 'Questions from clubs and families' : 'คำถามจากชมรมและครอบครัว'} items={FAQ[lang]} />
      </div>
    </MarketingAnswerLayout>
  );
}
