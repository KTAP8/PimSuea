import {
  DELIVERY_FEE_TIERS,
  DTG_PRINT_WHITE_QTY1,
  EXAMPLE_STARTING_PRICE_THB,
  GEO,
  GEO_URLS,
  SHIRT_BLANK_PRICING,
} from '@/content/geoFacts';
import { buildGeoJsonLd, buildPricingOfferJsonLd } from '@/lib/geoSchema';
import {
  AnswerH1,
  BilingualSections,
  MarketingAnswerLayout,
} from '@/components/MarketingAnswerLayout';

function PriceTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto not-prose">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h) => (
              <th key={h} className="text-left py-3 pr-4 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-4 text-muted-foreground font-light">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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

  const snapshotNote = `ข้อมูล ณ ${GEO.pricingSnapshotDate} — ราคาจริงใน design studio อาจต่างตาม blank และจำนวน`;

  return (
    <MarketingAnswerLayout
      title="ราคาพิมพ์เสื้อ DTG | ตารางราคา PimSuea"
      description="ตารางราคา blank + พิมพ์ DTG (3×4 / A5 / A4 / A3) และค่าจัดส่งตามจำนวน — รู้ราคาก่อนสั่งบน PimSuea"
      canonical={GEO_URLS.pricing}
      jsonLd={jsonLd}
      ctaLabelTh="ดูราคาสด"
      ctaLabelEn="See live pricing"
    >
      <BilingualSections
        th={
          <>
            <AnswerH1
              th="ราคาพิมพ์เสื้อ DTG — ตารางสาธารณะ"
              en="DTG t-shirt pricing — public rate card"
            />
            <p className="text-muted-foreground font-light">{snapshotNote}</p>
            <p className="text-sm">
              ตัวอย่างราคาเริ่มต้น (Regular สีขาว + พิมพ์ tier เล็กสุด):{' '}
              <strong>~฿{EXAMPLE_STARTING_PRICE_THB.toLocaleString()} / ชิ้น</strong>
            </p>

            <h2 className="text-xl font-black mt-8 mb-3">ราคา blank (qty 1–11)</h2>
            <PriceTable
              headers={['สินค้า', 'สี', 'ราคา/ชิ้น (THB)']}
              rows={[
                ['Regular T-Shirt', 'White', `฿${SHIRT_BLANK_PRICING.regularWhite.thb}`],
                ['Regular T-Shirt', 'Black', `฿${SHIRT_BLANK_PRICING.regularBlack.thb}`],
                ['Oversize T-Shirt', 'White', `฿${SHIRT_BLANK_PRICING.oversizeWhite.thb}`],
                ['Oversize T-Shirt', 'Black', `฿${SHIRT_BLANK_PRICING.oversizeBlack.thb}`],
              ]}
            />

            <h2 className="text-xl font-black mt-8 mb-3">ราคาพิมพ์ DTG — สีขาว (qty 1–11)</h2>
            <PriceTable
              headers={['ขนาดพิมพ์', 'ราคา/ชิ้น (THB)']}
              rows={DTG_PRINT_WHITE_QTY1.map((row) => [row.tier, `฿${row.thb}`])}
            />
            <p className="text-xs text-muted-foreground mt-2">
              สีดำและขนาดใหญ่กว่ามีราคาสูงขึ้น — ดูราคาตรงใน studio
            </p>

            <h2 className="text-xl font-black mt-8 mb-3">ค่าจัดส่ง (ตามจำนวนเสื้อ)</h2>
            <PriceTable
              headers={['จำนวน', 'ค่าจัดส่ง (THB)']}
              rows={DELIVERY_FEE_TIERS.map((t) => [
                t.label,
                t.thb === 0 ? 'ฟรี' : `฿${t.thb}`,
              ])}
            />
          </>
        }
        en={
          <>
            <h2 className="text-2xl font-black">Public pricing snapshot</h2>
            <p className="text-muted-foreground font-light">
              As of {GEO.pricingSnapshotDate}. Live totals in the design studio may vary by
              blank, print size, color, and quantity bracket.
            </p>
            <p className="text-sm">
              Example starting price (Regular white + smallest print tier):{' '}
              <strong>~฿{EXAMPLE_STARTING_PRICE_THB.toLocaleString()} / piece</strong>
            </p>

            <h3 className="text-lg font-black mt-6">Blank garments (qty 1–11)</h3>
            <PriceTable
              headers={['Garment', 'Color', 'THB / pc']}
              rows={[
                ['Regular T-Shirt', 'White', `฿${SHIRT_BLANK_PRICING.regularWhite.thb}`],
                ['Regular T-Shirt', 'Black', `฿${SHIRT_BLANK_PRICING.regularBlack.thb}`],
                ['Oversize T-Shirt', 'White', `฿${SHIRT_BLANK_PRICING.oversizeWhite.thb}`],
                ['Oversize T-Shirt', 'Black', `฿${SHIRT_BLANK_PRICING.oversizeBlack.thb}`],
              ]}
            />

            <h3 className="text-lg font-black mt-6">DTG print — white shirt (qty 1–11)</h3>
            <PriceTable
              headers={['Print size', 'THB / pc']}
              rows={DTG_PRINT_WHITE_QTY1.map((row) => [row.tier, `฿${row.thb}`])}
            />

            <h3 className="text-lg font-black mt-6">Delivery by quantity</h3>
            <PriceTable
              headers={['Quantity', 'Delivery THB']}
              rows={DELIVERY_FEE_TIERS.map((t) => [
                t.label,
                t.thb === 0 ? 'Free' : `฿${t.thb}`,
              ])}
            />
          </>
        }
      />
    </MarketingAnswerLayout>
  );
}
