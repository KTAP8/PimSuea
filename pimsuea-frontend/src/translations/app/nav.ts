import type { Language } from '@/i18n/types';

const th = {
  home: 'หน้าหลัก',
  catalog: 'แคตตาล็อก',
  myDesigns: 'งานของฉัน',
  cart: 'ตะกร้าสินค้า',
  orders: 'คำสั่งซื้อ',
  wallet: 'กระเป๋าเงิน',
  settings: 'ตั้งค่า',
  signOut: 'ออกจากระบบ',
  footerTerms: 'ข้อตกลงและเงื่อนไข',
};

const en: typeof th = {
  home: 'Home',
  catalog: 'Catalog',
  myDesigns: 'My designs',
  cart: 'Cart',
  orders: 'Orders',
  wallet: 'Wallet',
  settings: 'Settings',
  signOut: 'Sign out',
  footerTerms: 'Terms of Service',
};

export const navTranslations: Record<Language, typeof th> = { th, en };
