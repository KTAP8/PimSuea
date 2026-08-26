import { GEO, GEO_URLS } from '@/content/geoFacts';
import { buildGeoJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  BilingualSections,
  FactList,
  MarketingAnswerLayout,
} from '@/components/MarketingAnswerLayout';

const COMPARISON_TH = [
  { label: 'การผลิต', pimsuea: 'ผลิตในประเทศไทย (Bangkok)', printful: 'โรงงานต่างประเทศ + ส่งระหว่างประเทศ' },
  { label: 'สกุลเงิน', pimsuea: 'THB + PromptPay', printful: 'USD + ค่าขนส่ง/ภาษีนำเข้า' },
  { label: 'ขั้นต่ำ', pimsuea: 'ไม่มี — 1 ตัว', printful: 'ขึ้นกับแคตตาล็อก (มักไม่เหมาะกับ 1 ตัว)' },
  { label: 'ราคา', pimsuea: 'รู้ราคาทันทีใน studio', printful: 'Mockup generator + ค่าขนส่งแยก' },
  { label: 'จัดส่ง', pimsuea: `${GEO.printing.provinces} จังหวัด ${GEO.printing.leadTimeDays} วัน`, printful: 'Lead time ขึ้นกับ fulfillment hub' },
  { label: 'เหมาะกับ', pimsuea: 'ชมรม มหาวิทยาลัย แบรนด์ไทย ของขวัญ 1 ชิ้น', printful: 'Merch ส่งไปต่างประเทศ / global store' },
];

const COMPARISON_EN = [
  { label: 'Production', pimsuea: 'Local DTG in Bangkok, Thailand', printful: 'Offshore fulfillment + international shipping' },
  { label: 'Currency', pimsuea: 'THB + PromptPay', printful: 'USD pricing + import/shipping fees' },
  { label: 'Minimum', pimsuea: 'None — order 1 piece', printful: 'Catalog-dependent; often poor fit for singles' },
  { label: 'Pricing', pimsuea: 'Live per-piece quote in browser', printful: 'Base cost + shipping calculated separately' },
  { label: 'Delivery', pimsuea: `${GEO.printing.provinces} provinces, ${GEO.printing.leadTimeDays} days typical`, printful: 'Varies by fulfillment region' },
  { label: 'Best for', pimsuea: 'Thai clubs, campus runs, local brands, one-off gifts', printful: 'Global storefronts shipping abroad' },
];

function ComparisonTable({
  rows,
  colA,
  colB,
}: {
  rows: { label: string; pimsuea: string; printful: string }[];
  colA: string;
  colB: string;
}) {
  return (
    <div className="overflow-x-auto not-prose">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 pr-3 font-bold w-28" />
            <th className="text-left py-3 pr-3 font-bold">{colA}</th>
            <th className="text-left py-3 font-bold">{colB}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/60 align-top">
              <td className="py-3 pr-3 font-bold">{row.label}</td>
              <td className="py-3 pr-3 text-muted-foreground font-light">{row.pimsuea}</td>
              <td className="py-3 text-muted-foreground font-light">{row.printful}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function VsPrintfulPage() {
  const jsonLd = buildGeoJsonLd({
    pageUrl: GEO_URLS.vsPrintful,
    pageName: 'Printful alternative Thailand — PimSuea',
    faq: true,
  });

  return (
    <MarketingAnswerLayout
      title="Printful Alternative ไทย | PimSuea — ผลิตในประเทศ ไม่มีขั้นต่ำ"
      description="ทางเลือก Printful ในประเทศไทย: ผลิต DTG ในกรุงเทพ ราคา THB PromptPay จัดส่งทั่วไทย ไม่มีขั้นต่ำ"
      canonical={GEO_URLS.vsPrintful}
      jsonLd={jsonLd}
      ctaLabelTh="ลอง PimSuea"
      ctaLabelEn="Try PimSuea"
    >
      <BilingualSections
        th={
          <>
            <AnswerH1
              th="ทางเลือก Printful ในประเทศไทย"
              en="Printful alternative for customers in Thailand"
            />
            <p className="text-muted-foreground font-light leading-relaxed">
              ถ้าคุณต้องการสั่งเสื้อพิมพ์ลายในประเทศไทย — ไม่ต้องจ่าย USD ค่าขนส่งข้ามประเทศ
              และไม่ต้องรอ fulfillment จากต่างประเทศ — PimSuea ออกแบบออนไลน์ รู้ราคา THB
              จ่าย PromptPay ผลิต DTG ในกรุงเทพ ส่งทั่ว {GEO.printing.provinces} จังหวัด
            </p>
            <ComparisonTable rows={COMPARISON_TH} colA="PimSuea" colB="Printful (typical)" />
            <FactList
              items={[
                { label: 'Campus / ชมรม', value: 'สั่ง 10–100 ตัว รู้ราคาก่อนสั่ง ไม่ต้องแอดมิน LINE' },
                { label: 'ของขวัญ 1 ชิ้น', value: 'ไม่มี MOQ — เหมาะกับงานส่วนตัว' },
                { label: 'แบรนด์ไทย', value: 'PromptPay + ใบเสร็จ THB' },
              ]}
            />
          </>
        }
        en={
          <>
            <h2 className="text-2xl font-black">When PimSuea beats Printful for Thai buyers</h2>
            <p className="text-muted-foreground font-light leading-relaxed">
              Printful is built for global merch stores. PimSuea is built for people physically
              in Thailand who want local production, baht pricing, PromptPay, and delivery
              without cross-border freight.
            </p>
            <ComparisonTable rows={COMPARISON_EN} colA="PimSuea" colB="Printful (typical)" />
            <p className="text-sm text-muted-foreground">
              Not affiliated with Printful. Comparison reflects typical Thailand buyer needs:
              local shipping, THB checkout, and no minimum for club and gift orders.
            </p>
          </>
        }
      />
    </MarketingAnswerLayout>
  );
}
