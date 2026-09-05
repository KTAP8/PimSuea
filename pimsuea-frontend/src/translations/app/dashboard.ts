import type { Language } from '@/i18n/types';

const th = {
  greeting: 'สวัสดี',
  greetingWithName: 'สวัสดี, คุณ',
  statOrders: 'คำสั่งซื้อของคุณ',
  statDesigns: 'ดีไซน์ที่บันทึกไว้',
  statCart: 'สินค้าในตะกร้า',
  startNewDesign: 'เริ่มออกแบบใหม่',
  continueDesign: 'ออกแบบต่อจากที่ค้างไว้',
  viewOrders: 'ดูคำสั่งซื้อ',
  continueDesigning: 'ออกแบบต่อจากที่ค้างไว้',
  editContinue: 'แก้ไขต่อ',
  ongoingOrders: 'คำสั่งซื้อที่กำลังดำเนินการ',
  orderNumber: 'คำสั่งซื้อ #',
  publishedAt: 'เผยแพร่เมื่อ:',
  backToDashboard: 'กลับไปหน้าหลัก',
  newsLoadError: 'ไม่สามารถโหลดเนื้อหาข่าวได้',
  newsNotFound: 'ไม่พบเนื้อหา',
  loadError: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
  retry: 'ลองใหม่อีกครั้ง',
  heroTitle1: 'บริการ Print On Demand',
  heroTitle2: 'เพื่อคุณ โดยคุณ เราจัดการให้',
  heroSubtitle: 'ศูนย์รวมงานสกรีนคุณภาพสูง ออกแบบเองได้ง่ายๆ เริ่มต้นเพียง 1 ชิ้น ส่งตรงถึงบ้านคุณ',
  heroCta: 'เริ่มสั่งทำเลย',
  newsTitle: 'ข่าวสารและโปรโมชั่น',
  bestSellers: 'สินค้าขายดี',
  soldCount: 'ขายแล้ว',
  choose: 'เลือก',
};

const en: typeof th = {
  greeting: 'Hello',
  greetingWithName: 'Hello,',
  statOrders: 'Your orders',
  statDesigns: 'Saved designs',
  statCart: 'Items in cart',
  startNewDesign: 'Start a new design',
  continueDesign: 'Continue where you left off',
  viewOrders: 'View orders',
  continueDesigning: 'Continue designing',
  editContinue: 'Continue editing',
  ongoingOrders: 'Orders in progress',
  orderNumber: 'Order #',
  publishedAt: 'Published:',
  backToDashboard: 'Back to dashboard',
  newsLoadError: 'Could not load this article',
  newsNotFound: 'Content not found',
  loadError: 'Failed to load dashboard data',
  retry: 'Try again',
  heroTitle1: 'Print on demand',
  heroTitle2: 'by you, for you — we handle the rest',
  heroSubtitle: 'Premium custom printing made simple. Design online, order from 1 piece, delivered to your door.',
  heroCta: 'Start ordering',
  newsTitle: 'News & promotions',
  bestSellers: 'Best sellers',
  soldCount: 'Sold',
  choose: 'Choose',
};

export const dashboardTranslations: Record<Language, typeof th> = { th, en };

export function orderStatusLabels(lang: Language): Record<string, string> {
  if (lang === 'en') {
    return {
      pending_payment: 'Awaiting payment',
      pending: 'Pending',
      paid_processing: 'Paid & in production',
      shipped: 'Shipped',
    };
  }
  return {
    pending_payment: 'รอชำระเงิน',
    pending: 'รอดำเนินการ',
    paid_processing: 'ชำระแล้ว & กำลังผลิต',
    shipped: 'จัดส่งแล้ว',
  };
}
