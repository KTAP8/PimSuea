import type { GiftRecipientInfo } from '@/types/gift';

export type AddressField = keyof Pick<
  GiftRecipientInfo,
  'fullName' | 'phone' | 'addressLine1' | 'province' | 'district' | 'postalCode'
>;

export const REQUIRED_ADDRESS_FIELDS: AddressField[] = [
  'fullName',
  'phone',
  'province',
  'district',
  'postalCode',
  'addressLine1',
];

export function filterAddressInput(field: keyof GiftRecipientInfo, value: string): string {
  if (field === 'phone') return value.replace(/\D/g, '');
  if (field === 'postalCode') return value.replace(/\D/g, '').slice(0, 5);
  return value;
}

const MESSAGES = {
  th: {
    fullName: 'กรุณากรอกชื่อ-นามสกุล', phoneRequired: 'กรุณากรอกเบอร์โทรศัพท์', phoneInvalid: 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)',
    province: 'กรุณากรอกจังหวัด', district: 'กรุณากรอกเขต/อำเภอ', postalRequired: 'กรุณากรอกรหัสไปรษณีย์',
    postalInvalid: 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก', addressLine1: 'กรุณากรอกที่อยู่',
  },
  en: {
    fullName: 'Enter the recipient’s full name', phoneRequired: 'Enter a phone number', phoneInvalid: 'Use a Thai mobile number, e.g. 0812345678',
    province: 'Choose a province', district: 'Choose a district', postalRequired: 'Enter the postal code',
    postalInvalid: 'Postal code must be 5 digits', addressLine1: 'Enter the street address',
  },
};

export function validateAddressField(field: AddressField, value: string, lang: 'th' | 'en' = 'th'): string | undefined {
  const m = MESSAGES[lang];
  switch (field) {
    case 'fullName':
      return value.trim() ? undefined : m.fullName;
    case 'phone':
      if (!value.trim()) return m.phoneRequired;
      if (!/^0\d{8,9}$/.test(value.trim())) return m.phoneInvalid;
      return undefined;
    case 'province':
      return value.trim() ? undefined : m.province;
    case 'district':
      return value.trim() ? undefined : m.district;
    case 'postalCode':
      if (!value.trim()) return m.postalRequired;
      if (!/^\d{5}$/.test(value.trim())) return m.postalInvalid;
      return undefined;
    case 'addressLine1':
      return value.trim() ? undefined : m.addressLine1;
    default:
      return undefined;
  }
}

export function validateAddressFields(
  info: Partial<GiftRecipientInfo> | undefined,
): Partial<Record<AddressField, string>> {
  const errors: Partial<Record<AddressField, string>> = {};
  for (const field of REQUIRED_ADDRESS_FIELDS) {
    const err = validateAddressField(field, info?.[field] ?? '');
    if (err) errors[field] = err;
  }
  return errors;
}

export function firstAddressError(info: Partial<GiftRecipientInfo> | undefined): string | null {
  for (const field of REQUIRED_ADDRESS_FIELDS) {
    const err = validateAddressField(field, info?.[field] ?? '');
    if (err) return err;
  }
  return null;
}
