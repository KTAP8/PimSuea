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

  const snapshotNote = `ข้อมูลจาก Supabase ณ ${GEO.pricingSnapshotDate} — ราคาจริงใน design studio อาจต่างตามไซส์ สี และจำนวน`;

  const garmentRowsTh = GARMENT_PRICING.flatMap((g) =>
    g.colors.map((c) => [g.nameTh, c.labelTh, g.sizeNote, g.qtyLabel, `฿${c.thb}`])
  );

  const garmentRowsEn = GARMENT_PRICING.flatMap((g) =>
    g.colors.map((c) => [g.nameEn, c.labelEn, g.sizeNote, g.qtyLabel, `฿${c.thb}`])
  );

  return (
    <MarketingAnswerLayout
      title="ราคาพิมพ์เสื้อ DTG | ตารางราคา PimSuea"
      description="ตารางราคาเสื้อ + พิมพ์ DTG (3×4 / A5 / A4 / A3) และค่าจัดส่งตามจำนวน — จากระบบ PimSuea จริง"
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
              ตัวอย่างราคาเริ่มต้น (เสื้อยืดสกรีนลงเนื้อผ้า สีขาว + พิมพ์ 3×4&quot;):{' '}
              <strong>~฿{EXAMPLE_STARTING_PRICE_THB.toLocaleString()} / ชิ้น</strong>
            </p>

            <h2 className="text-xl font-black mt-8 mb-3">ราคาเสื้อ (garment)</h2>
            <PriceTable
              headers={['สินค้า', 'สี', 'ไซส์', 'จำนวน', 'ราคา/ชิ้น']}
              rows={garmentRowsTh}
            />

            <h2 className="text-xl font-black mt-8 mb-3">ราคาพิมพ์ DTG — สีขาว (1–11 ชิ้น)</h2>
            <PriceTable
              headers={['ขนาดพิมพ์', 'ราคา/ชิ้น (THB)']}
              rows={DTG_PRINT_QTY1_11.white.map((row) => [row.tier, `฿${row.thb}`])}
            />

            <h2 className="text-xl font-black mt-8 mb-3">ราคาพิมพ์ DTG — สีอื่น (1–11 ชิ้น)</h2>
            <PriceTable
              headers={['ขนาดพิมพ์', 'ราคา/ชิ้น (THB)']}
              rows={DTG_PRINT_QTY1_11.other.map((row) => [row.tier, `฿${row.thb}`])}
            />
            <p className="text-xs text-muted-foreground mt-2">
              ราคาลดเมื่อจำนวนมากขึ้น — ดู bracket ถัดไปใน design studio
            </p>

            <h2 className="text-xl font-black mt-8 mb-3">ค่าจัดส่ง (ตามจำนวนเสื้อ)</h2>
            <PriceTable
              headers={['จำนวน', 'ค่าจัดส่ง (THB)']}
              rows={DELIVERY_FEE_TIERS.map((t) => [t.label, `฿${t.thb}`])}
            />
          </>
        }
        en={
          <>
            <h2 className="text-2xl font-black">Public pricing snapshot</h2>
            <p className="text-muted-foreground font-light">
              Pulled from Supabase on {GEO.pricingSnapshotDate}. Live totals in the design
              studio may vary by size, color, and quantity bracket.
            </p>
            <p className="text-sm">
              Example starting price (classic white tee + 3×4&quot; print):{' '}
              <strong>~฿{EXAMPLE_STARTING_PRICE_THB.toLocaleString()} / piece</strong>
            </p>

            <h3 className="text-lg font-black mt-6">Garment pricing</h3>
            <PriceTable
              headers={['Garment', 'Color', 'Size', 'Quantity', 'THB / pc']}
              rows={garmentRowsEn}
            />

            <h3 className="text-lg font-black mt-6">DTG print — white (qty 1–11)</h3>
            <PriceTable
              headers={['Print size', 'THB / pc']}
              rows={DTG_PRINT_QTY1_11.white.map((row) => [row.tier, `฿${row.thb}`])}
            />

            <h3 className="text-lg font-black mt-6">DTG print — other colors (qty 1–11)</h3>
            <PriceTable
              headers={['Print size', 'THB / pc']}
              rows={DTG_PRINT_QTY1_11.other.map((row) => [row.tier, `฿${row.thb}`])}
            />

            <h3 className="text-lg font-black mt-6">Delivery by quantity</h3>
            <PriceTable
              headers={['Quantity', 'Delivery THB']}
              rows={DELIVERY_FEE_TIERS.map((t) => [t.labelEn, `฿${t.thb}`])}
            />
          </>
        }
      />
    </MarketingAnswerLayout>
  );
}
