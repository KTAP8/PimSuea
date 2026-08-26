import {
  CASE_NOTES,
  GEO,
  GEO_URLS,
} from '@/content/geoFacts';
import { buildCaseNotesJsonLd, buildGeoJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  BilingualSections,
  FactList,
  MarketingAnswerLayout,
} from '@/components/MarketingAnswerLayout';

export default function PrintOnDemandPage() {
  const jsonLd = [
    buildGeoJsonLd({
      pageUrl: GEO_URLS.printOnDemand,
      pageName: 'Print on demand Thailand — PimSuea',
      faq: true,
    }),
    buildCaseNotesJsonLd(),
  ];

  return (
    <MarketingAnswerLayout
      title="Print on Demand ไทย | สั่งพิมพ์เสื้อไม่มีขั้นต่ำ | PimSuea"
      description={`${GEO.taglineTh} พิมพ์ DTG รู้ราคาทันที PromptPay จัดส่ง ${GEO.printing.provinces} จังหวัด ${GEO.printing.leadTimeDays} วัน`}
      canonical={GEO_URLS.printOnDemand}
      jsonLd={jsonLd}
      ctaLabelTh="เริ่มออกแบบ"
      ctaLabelEn="Start designing"
    >
      <BilingualSections
        th={
          <>
            <AnswerH1
              th="Print on Demand ในประเทศไทย — ไม่มีขั้นต่ำ"
              en="Print on demand in Thailand — no minimum order"
            />
            <p className="text-muted-foreground font-light leading-relaxed">
              {GEO.oneLiner} ไม่ต้องคุยแอดมิน LINE รอใบเสนอราคา — ออกแบบบนเว็บ
              ดูราคาต่อชิ้นแบบเรียลไทม์ จ่าย PromptPay แล้วรอรับที่บ้านทั่ว{' '}
              {GEO.printing.provinces} จังหวัด
            </p>
            <FactList
              items={[
                { label: 'เทคนิคพิมพ์', value: 'DTG (Direct to Garment)' },
                { label: 'ขั้นต่ำ', value: 'ไม่มี — สั่ง 1 ตัวได้' },
                { label: 'ราคา', value: 'คำนวณทันทีใน design studio (THB)' },
                { label: 'ชำระเงิน', value: 'PromptPay' },
                { label: 'ระยะเวลา', value: `${GEO.printing.leadTimeDays} วัน` },
                { label: 'พื้นที่ให้บริการ', value: `ทั่วไทย ${GEO.printing.provinces} จังหวัด` },
                { label: 'ต่างจากร้าน LINE', value: 'Self-serve ออกแบบ + รู้ราคาก่อนสั่ง' },
              ]}
            />
            <h2 className="text-xl font-black mt-10 mb-4">งานจริงจากลูกค้า</h2>
            <ol className="space-y-4 list-decimal list-inside text-muted-foreground font-light">
              {CASE_NOTES.map((note) => (
                <li key={note.id}>
                  <strong className="text-foreground">{note.name}</strong> — {note.qty}{' '}
                  ชิ้น ({note.year}). {note.summaryTh}
                </li>
              ))}
            </ol>
          </>
        }
        en={
          <>
            <h2 className="text-2xl font-black">Why PimSuea for Thai POD</h2>
            <p className="text-muted-foreground font-light leading-relaxed">
              Local production in Bangkok, THB pricing, PromptPay checkout, and nationwide
              delivery — without the USD freight and MOQ of international POD platforms.
              Design in the browser, approve your layout, and see exact per-piece cost before
              you pay.
            </p>
            <FactList
              items={[
                { label: 'Print method', value: 'DTG on premium cotton blanks' },
                { label: 'Minimum', value: 'None — order 1 or 100+' },
                { label: 'Pricing', value: 'Live quote in the design studio' },
                { label: 'Payment', value: 'PromptPay (THB)' },
                { label: 'Lead time', value: `${GEO.printing.leadTimeDays} days typical` },
                { label: 'Coverage', value: `All ${GEO.printing.provinces} provinces` },
              ]}
            />
            <h3 className="text-lg font-black mt-8">Real orders</h3>
            <ol className="space-y-3 list-decimal list-inside text-muted-foreground font-light">
              {CASE_NOTES.map((note) => (
                <li key={note.id}>
                  <strong className="text-foreground">{note.name}</strong> — {note.qty} pcs (
                  {note.year}). {note.summaryEn}
                </li>
              ))}
            </ol>
          </>
        }
      />
    </MarketingAnswerLayout>
  );
}
