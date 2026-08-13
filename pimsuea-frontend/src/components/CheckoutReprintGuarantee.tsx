import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const copy = {
  th: {
    heading: 'พิมพ์ผิดจากที่คุณอนุมัติ เราพิมพ์ใหม่ให้ฟรี',
    body: 'ตรวจสอบภาพตัวอย่าง (mockup) ก่อนสั่งซื้อทุกครั้ง ถ้าของที่ได้รับไม่ตรงอย่างชัดเจน — ตำแหน่งคลาดเกิน 2 นิ้ว สี หรือขนาดพิมพ์ผิด — เราพิมพ์ใหม่ให้ฟรีภายใน 7 วันหลังได้รับสินค้า',
    policyLink: 'ดูรายละเอียดนโยบาย',
  },
  en: {
    heading: "Doesn't match what you approved? We reprint free.",
    body: "Check your mockup carefully before ordering. If what arrives clearly doesn't match — position off by more than 2 inches, or wrong color or print size — we reprint it free within 7 days of delivery.",
    policyLink: 'View full policy',
  },
} as const;

type Locale = keyof typeof copy;

interface Props {
  onPolicyClick: () => void;
  locale?: Locale;
  className?: string;
}

export function CheckoutReprintGuarantee({ onPolicyClick, locale = 'th', className }: Props) {
  const t = copy[locale];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4',
        className,
      )}
    >
      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 space-y-1.5">
        <p className="font-bold text-sm text-foreground leading-snug">{t.heading}</p>
        <p className="text-sm text-muted-foreground font-light leading-relaxed">{t.body}</p>
        <button
          type="button"
          onClick={onPolicyClick}
          className="text-xs text-primary hover:underline font-medium"
        >
          {t.policyLink}
        </button>
      </div>
    </div>
  );
}
