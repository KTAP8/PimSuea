import type { Language } from '@/i18n/types';

export interface HolidayPromoCopy {
  eyebrow: string;
  headline: string;
  discount: string;
  stamp: string;
  subline: string;
  badge: string;
  codeLabel: string;
  tapToCopy: string;
  copied: string;
  endsIn: string;
  unitDays: string;
  unitHours: string;
  unitMinutes: string;
  unitSeconds: string;
  terms: string;
  cta: string;
  autoApply: string;
  closeAria: string;
}

export const HOLIDAY_PROMO_COPY: Record<Language, HolidayPromoCopy> = {
  en: {
    eyebrow: 'Holiday drop · Limited time',
    headline: '20% off custom shirts.',
    discount: '20%',
    stamp: 'OFF',
    subline: 'Custom shirts for the whole crew.',
    badge: 'HOLIDAY20 • 20% OFF • NO MINIMUM • ',
    codeLabel: 'Your code',
    tapToCopy: 'Tap to copy',
    copied: 'Copied!',
    endsIn: 'Offer ends in',
    unitDays: 'days',
    unitHours: 'hrs',
    unitMinutes: 'min',
    unitSeconds: 'sec',
    terms: 'Up to ฿200 off · Max 5 pieces · One use per account · Ends 10 Dec.',
    cta: 'Start designing — 20% off',
    autoApply: 'Code applies automatically at checkout',
    closeAria: 'Close offer',
  },
  th: {
    eyebrow: 'โปรวันหยุด · เวลาจำกัด',
    headline: 'ลด 20% ช่วงวันหยุด',
    discount: '20%',
    stamp: 'OFF',
    subline: 'สกรีนเสื้อตามใจ ทั้งแก๊งก็ได้',
    badge: 'HOLIDAY20 • ลด 20% • ไม่มีขั้นต่ำ • ',
    codeLabel: 'โค้ดของคุณ',
    tapToCopy: 'แตะเพื่อคัดลอก',
    copied: 'คัดลอกแล้ว!',
    endsIn: 'หมดเขตใน',
    unitDays: 'วัน',
    unitHours: 'ชม.',
    unitMinutes: 'นาที',
    unitSeconds: 'วินาที',
    terms: 'สูงสุด ฿200 · สูงสุด 5 ชิ้น · ใช้ได้ 1 ครั้งต่อบัญชี · ถึง 10 ธ.ค.',
    cta: 'เริ่มออกแบบ — ลด 20%',
    autoApply: 'ระบบใส่โค้ดให้อัตโนมัติตอนชำระเงิน',
    closeAria: 'ปิดโปรโมชัน',
  },
};
