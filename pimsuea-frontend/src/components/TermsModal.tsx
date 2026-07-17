import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

const content = {
  en: {
    title: 'Pimsuea Terms of Service',
    updated: 'Last Updated: March 2026',
    tldrTitle: 'The Short Version (TL;DR)',
    tldrIntro: 'We believe in keeping things seamless. Before you dive into the legal details below, here are the core rules of using our canvas:',
    tldr: [
      { bold: 'Own your art:', text: 'Do not upload trademarked logos or stolen artwork. You must own the rights to what you print.' },
      { bold: 'Screens vs. Reality:', text: 'Your screen shows light (RGB); our printers use ink (CMYK). Colors and placements may have minor, industry-standard variations.' },
      { bold: 'Custom means custom:', text: 'Because we engineer 1-of-1 items specifically for you, we cannot accept returns if you choose the wrong size or simply change your mind. We only refund or replace if there is a manufacturing defect.' },
      { bold: 'Patience is premium:', text: 'Standard production time is 5 to 14 days before shipping.' },
    ],
    sections: [
      {
        title: '1. Acceptance of Terms',
        body: 'By accessing the Pimsuea website, using our 3D design canvas, or placing an order, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not use our platform.',
        bullets: [],
      },
      {
        title: '2. Intellectual Property & Copyright',
        body: 'Pimsuea provides the infrastructure; you provide the vision.',
        bullets: [
          { bold: 'Your Ownership:', text: 'You retain all rights and ownership to the original designs, logos, and artwork you upload to our servers.' },
          { bold: 'Your Responsibility:', text: 'By uploading a design, you legally warrant that you own the copyright, trademark, or have explicit written permission to reproduce the image.' },
          { bold: 'Indemnification:', text: 'If Pimsuea is subject to legal action or financial loss due to copyright infringement caused by your uploaded design, you agree to cover all associated legal fees, damages, and settlements.' },
          { bold: 'Content Restrictions:', text: 'We reserve the right to reject and cancel any order that contains hate speech, illegal material, explicit content, or promotes violence, at our sole discretion.' },
        ],
      },
      {
        title: '3. The "Screen to Fabric" Disclaimer (Hardware Tolerances)',
        body: 'We bridge digital software with physical hardware (DTG printing). By ordering, you acknowledge the following manufacturing realities:',
        bullets: [
          { bold: 'Color Variances:', text: 'Digital mockups on our web canvas are displayed in RGB, while our industrial printers operate in CMYK. Minor color shifts, particularly a softer, matte finish on DTG prints, are expected and do not constitute a defect.' },
          { bold: 'Placement & Scale:', text: 'The 3D web canvas is an accurate representation, but physical garment printing carries an industry-standard placement tolerance of 0.5 to 1 inch.' },
          { bold: 'Garment Characteristics:', text: 'Premium heavyweight cotton may exhibit slight variations in dye lots, fabric weave, or sizing tolerances (+/- 1 inch) between different production batches.' },
        ],
      },
      {
        title: '4. Production & Shipping',
        body: '',
        bullets: [
          { bold: 'Production Time:', text: 'Our standard turnaround time to engineer and print your custom order is 5 to 14 days from the moment payment is confirmed.' },
          { bold: 'Shipping:', text: 'Once your package is handed over to our courier partners, transit times are estimates, not guarantees. Pimsuea is not legally liable for delivery delays caused by the courier, weather events, or incorrect shipping addresses provided at checkout.' },
        ],
      },
      {
        title: '5. Returns, Refunds & Cancellations',
        body: 'Because Pimsuea operates on a zero-minimum, print-on-demand model, every piece of clothing is uniquely engineered for the specific user.',
        bullets: [
          { bold: 'No "Buyer\'s Remorse":', text: 'We do not hold inventory. Therefore, we cannot accept returns, exchanges, or issue refunds if you order the incorrect size, select the wrong garment color, or change your mind after the order is placed. Please review the size charts carefully before checkout.' },
          { bold: 'Defects & Errors:', text: 'If your item arrives with a clear manufacturing defect (e.g., a torn garment, peeling print, or a massive printing error that deviates entirely from your uploaded file), we will gladly replace it. You must submit a claim with photo evidence to our support team within 7 days of receiving your package.' },
          { bold: 'Order Finality:', text: 'Once an order is placed and the design enters our automated production queue, it cannot be modified, scaled, or canceled.' },
        ],
      },
      {
        title: '6. Pricing & System Errors',
        body: 'Our platform utilizes automated, real-time pricing algorithms to calculate bulk discounts instantly.',
        bullets: [
          { bold: '', text: 'In the event of a software bug or typographical error that results in an incorrect price being displayed (e.g., a bulk order pricing at ฿0), Pimsuea reserves the right to cancel the order, refund any processed payment, and notify you of the system error.' },
        ],
      },
      {
        title: '7. Limitation of Liability',
        body: 'To the maximum extent permitted by law, Pimsuea shall not be liable for any indirect, incidental, or consequential damages arising out of the use or inability to use our platform, including but not limited to lost profits, delayed team events, or business interruptions.',
        bullets: [],
      },
    ],
  },
  th: {
    title: 'ข้อตกลงและเงื่อนไขการใช้บริการ Pimsuea',
    updated: 'อัปเดตล่าสุด: มีนาคม 2026',
    tldrTitle: 'สรุปแบบรวบรัด (The Short Version)',
    tldrIntro: 'เราเชื่อในความเรียบง่ายและไร้รอยต่อ ก่อนที่คุณจะอ่านรายละเอียดทางกฎหมายฉบับเต็มด้านล่าง นี่คือกฎพื้นฐานในการใช้งานแพลตฟอร์มของเรา:',
    tldr: [
      { bold: 'ลิขสิทธิ์ต้องเป็นของคุณ:', text: 'ห้ามอัปโหลดโลโก้ที่มีเครื่องหมายการค้าหรืองานศิลปะที่ละเมิดลิขสิทธิ์ คุณต้องเป็นเจ้าของสิทธิ์ในสิ่งที่คุณสั่งพิมพ์' },
      { bold: 'หน้าจอกับของจริง:', text: 'หน้าจอของคุณแสดงผลด้วยแสง (RGB) แต่เครื่องพิมพ์ของเราใช้หมึก (CMYK) สีและตำแหน่งการวางอาจมีความคลาดเคลื่อนเล็กน้อยตามมาตรฐานการผลิต' },
      { bold: 'สั่งทำพิเศษคือการผลิตเพื่อคุณคนเดียว:', text: 'เนื่องจากเราผลิตสินค้าแบบ 1-of-1 เฉพาะสำหรับคุณ เราจึงไม่สามารถรับคืนสินค้าได้หากคุณเลือกไซส์ผิดหรือเปลี่ยนใจ เราจะคืนเงินหรือส่งสินค้าชิ้นใหม่ให้เฉพาะในกรณีที่มีความบกพร่องจากการผลิตเท่านั้น' },
      { bold: 'ของพรีเมียมต้องใช้เวลา:', text: 'ระยะเวลาการผลิตตามมาตรฐานของเราคือ 5 ถึง 14 วันทำการก่อนทำการจัดส่ง' },
    ],
    sections: [
      {
        title: '1. การยอมรับข้อตกลง',
        body: 'การเข้าสู่เว็บไซต์ Pimsuea, การใช้งานแคนวาสออกแบบ 3D, หรือการสั่งซื้อสินค้า ถือว่าคุณยอมรับข้อตกลงและเงื่อนไขการใช้บริการเหล่านี้ หากคุณไม่ยอมรับข้อตกลงทั้งหมด คุณจะไม่สามารถใช้งานแพลตฟอร์มของเราได้',
        bullets: [],
      },
      {
        title: '2. ทรัพย์สินทางปัญญาและลิขสิทธิ์',
        body: 'Pimsuea มีโครงสร้างพื้นฐานให้ ส่วนคุณคือผู้สร้างสรรค์',
        bullets: [
          { bold: 'สิทธิ์ของคุณ:', text: 'คุณยังคงเป็นเจ้าของสิทธิ์และกรรมสิทธิ์ในดีไซน์ โลโก้ และผลงานศิลปะทั้งหมดที่คุณอัปโหลดเข้าสู่เซิร์ฟเวอร์ของเรา' },
          { bold: 'ความรับผิดชอบของคุณ:', text: 'เมื่อคุณอัปโหลดดีไซน์ คุณรับรองทางกฎหมายว่าคุณเป็นเจ้าของลิขสิทธิ์ เครื่องหมายการค้า หรือได้รับอนุญาตเป็นลายลักษณ์อักษรให้ทำซ้ำรูปภาพนั้นๆ ได้' },
          { bold: 'การชดเชยค่าเสียหาย:', text: 'หาก Pimsuea ถูกดำเนินคดีทางกฎหมายหรือเกิดความสูญเสียทางการเงินจากการละเมิดลิขสิทธิ์ที่เกิดจากดีไซน์ที่คุณอัปโหลด คุณตกลงที่จะรับผิดชอบค่าธรรมเนียมทางกฎหมาย ค่าเสียหาย และค่าสินไหมทดแทนที่เกี่ยวข้องทั้งหมด' },
          { bold: 'ข้อจำกัดด้านเนื้อหา:', text: 'เราขอสงวนสิทธิ์ในการปฏิเสธและยกเลิกคำสั่งซื้อที่มีเนื้อหาสร้างความเกลียดชัง ผิดกฎหมาย อนาจาร หรือส่งเสริมความรุนแรง ตามดุลยพินิจของเราแต่เพียงผู้เดียว' },
        ],
      },
      {
        title: '3. ข้อจำกัด "จากหน้าจอสู่เนื้อผ้า" (ความคลาดเคลื่อนทางฮาร์ดแวร์)',
        body: 'เราเชื่อมต่อซอฟต์แวร์ดิจิทัลเข้ากับฮาร์ดแวร์จริง (การพิมพ์ DTG) เมื่อทำการสั่งซื้อ คุณรับทราบถึงข้อจำกัดในการผลิตดังต่อไปนี้:',
        bullets: [
          { bold: 'ความคลาดเคลื่อนของสี:', text: 'ภาพม็อคอัพดิจิทัลบนหน้าเว็บแสดงผลเป็น RGB ในขณะที่เครื่องพิมพ์อุตสาหกรรมของเราทำงานในระบบ CMYK สีอาจมีการคลาดเคลื่อนเล็กน้อย โดยเฉพาะงานพิมพ์ DTG ที่สีจะมีความซอฟต์และแมตต์ขึ้น ซึ่งถือเป็นเรื่องปกติและไม่ใช่ข้อบกพร่อง' },
          { bold: 'ตำแหน่งและสัดส่วน:', text: 'แคนวาส 3D บนหน้าเว็บเป็นการจำลองที่แม่นยำ แต่การพิมพ์ลงบนเสื้อผ้าจริงอาจมีความคลาดเคลื่อนของตำแหน่งตามมาตรฐานอุตสาหกรรมที่ 0.5 ถึง 1 นิ้ว' },
          { bold: 'ลักษณะเฉพาะของเนื้อผ้า:', text: 'ผ้าคอตตอนพรีเมียมแบบหนาอาจมีความแตกต่างเล็กน้อยในเรื่องของสีย้อม การทอ หรือไซส์เสื้อ (+/- 1 นิ้ว) ระหว่างล็อตการผลิตที่ต่างกัน' },
        ],
      },
      {
        title: '4. การผลิตและการจัดส่ง',
        body: '',
        bullets: [
          { bold: 'ระยะเวลาการผลิต:', text: 'ระยะเวลามาตรฐานในการเตรียมและสกรีนออเดอร์คัสตอมของคุณคือ 5 ถึง 14 วัน นับจากเวลาที่ระบบยืนยันการชำระเงิน' },
          { bold: 'การจัดส่ง:', text: 'เมื่อพัสดุของคุณถูกส่งมอบให้กับพาร์ทเนอร์บริษัทขนส่งแล้ว ระยะเวลาการจัดส่งจะเป็นเพียงการประมาณการ ไม่ใช่การรับประกัน Pimsuea จะไม่รับผิดชอบทางกฎหมายต่อความล่าช้าในการจัดส่งที่เกิดจากบริษัทขนส่ง สภาพอากาศ หรือการระบุที่อยู่จัดส่งผิดพลาดโดยผู้ใช้บริการ' },
        ],
      },
      {
        title: '5. การคืนสินค้า การคืนเงิน และการยกเลิก',
        body: 'เนื่องจาก Pimsuea ดำเนินงานในรูปแบบ Print-on-Demand แบบไม่มีขั้นต่ำ เสื้อผ้าทุกชิ้นจึงถูกผลิตขึ้นมาใหม่เพื่อผู้ใช้แต่ละรายโดยเฉพาะ',
        bullets: [
          { bold: 'ไม่รับคืนสินค้ากรณีเปลี่ยนใจ:', text: 'เราไม่มีการสต็อกสินค้า ดังนั้นเราจึงไม่สามารถรับคืนสินค้า เปลี่ยนสินค้า หรือคืนเงินได้ ในกรณีที่คุณสั่งผิดไซส์ เลือกสีเสื้อผิด หรือเปลี่ยนใจหลังจากทำรายการสั่งซื้อไปแล้ว โปรดตรวจสอบตารางไซส์อย่างละเอียดก่อนชำระเงิน' },
          { bold: 'สินค้ามีตำหนิหรือข้อผิดพลาด:', text: 'หากสินค้าของคุณส่งถึงมือพร้อมข้อบกพร่องจากการผลิตที่ชัดเจน (เช่น เสื้อขาด งานพิมพ์ลอก หรือการสกรีนผิดพลาดอย่างร้ายแรงและไม่ตรงกับไฟล์ที่คุณอัปโหลด) เรายินดีที่จะผลิตและจัดส่งให้ใหม่ โดยคุณต้องส่งคำร้องพร้อมหลักฐานรูปถ่ายมายังทีมซัพพอร์ตของเราภายใน 7 วัน นับจากวันที่ได้รับพัสดุ' },
          { bold: 'ความสิ้นสุดของคำสั่งซื้อ:', text: 'เมื่อคำสั่งซื้อเสร็จสมบูรณ์และดีไซน์เข้าสู่คิวการผลิตอัตโนมัติของเราแล้ว จะไม่สามารถแก้ไข ปรับขนาด หรือยกเลิกได้' },
        ],
      },
      {
        title: '6. ราคาและข้อผิดพลาดของระบบ',
        body: 'แพลตฟอร์มของเราใช้อัลกอริทึมในการคำนวณราคาแบบเรียลไทม์เพื่อมอบส่วนลดสำหรับการสั่งซื้อจำนวนมากในทันที',
        bullets: [
          { bold: '', text: 'ในกรณีที่มีข้อผิดพลาดของซอฟต์แวร์หรือการแสดงผลที่ส่งผลให้ราคาผิดเพี้ยนไปจากความเป็นจริง (เช่น สั่งออเดอร์จำนวนมากแต่ราคาแสดงเป็น 0 บาท) Pimsuea ขอสงวนสิทธิ์ในการยกเลิกคำสั่งซื้อดังกล่าว คืนเงินที่คุณได้ชำระเข้ามา และแจ้งให้คุณทราบถึงข้อผิดพลาดของระบบ' },
        ],
      },
      {
        title: '7. ข้อจำกัดความรับผิด',
        body: 'ภายใต้ขอบเขตสูงสุดที่กฎหมายอนุญาต Pimsuea จะไม่รับผิดชอบต่อความเสียหายทางอ้อม ความเสียหายเกี่ยวเนื่อง หรือความเสียหายที่เป็นผลตามมา ซึ่งเกิดจากการใช้งานหรือการไม่สามารถใช้งานแพลตฟอร์มของเราได้ รวมถึงแต่ไม่จำกัดเพียง การสูญเสียผลกำไร ความล่าช้าของงานกิจกรรม หรือการหยุดชะงักทางธุรกิจ',
        bullets: [],
      },
    ],
  },
};

export function TermsModal({ open, onClose }: TermsModalProps) {
  const [lang, setLang] = useState<'en' | 'th'>('th');
  const t = content[lang];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-lg font-bold leading-tight">{t.title}</DialogTitle>
            <div className="flex shrink-0 rounded-md border overflow-hidden text-xs font-medium">
              <button
                className={`px-3 py-1.5 transition-colors ${lang === 'th' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setLang('th')}
              >
                ไทย
              </button>
              <button
                className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">{t.updated}</p>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-4 space-y-6 text-sm text-gray-700">
          {/* TL;DR */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-base text-gray-900">{t.tldrTitle}</h3>
            <p className="text-gray-600">{t.tldrIntro}</p>
            <ol className="space-y-2 list-decimal list-inside">
              {t.tldr.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  <span className="font-semibold">{item.bold}</span>{' '}
                  <span className="text-gray-600">{item.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <hr />

          {/* Sections */}
          {t.sections.map((section, i) => (
            <div key={i} className="space-y-2">
              <h3 className="font-bold text-base text-gray-900">{section.title}</h3>
              {section.body && <p className="text-gray-600 leading-relaxed">{section.body}</p>}
              {section.bullets.length > 0 && (
                <ul className="space-y-2 mt-2">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2 leading-relaxed">
                      <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                      <span>
                        {b.bold && <span className="font-semibold">{b.bold} </span>}
                        <span className="text-gray-600">{b.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t shrink-0">
          <Button className="w-full" onClick={onClose}>
            {lang === 'th' ? 'ปิด' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
