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

export function validateAddressField(field: AddressField, value: string): string | undefined {
  switch (field) {
    case 'fullName':
      return value.trim() ? undefined : 'กรุณากรอกชื่อ-นามสกุล';
    case 'phone':
      if (!value.trim()) return 'กรุณากรอกเบอร์โทรศัพท์';
      if (!/^0\d{8,9}$/.test(value.trim())) return 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)';
      return undefined;
    case 'province':
      return value.trim() ? undefined : 'กรุณากรอกจังหวัด';
    case 'district':
      return value.trim() ? undefined : 'กรุณากรอกเขต/อำเภอ';
    case 'postalCode':
      if (!value.trim()) return 'กรุณากรอกรหัสไปรษณีย์';
      if (!/^\d{5}$/.test(value.trim())) return 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก';
      return undefined;
    case 'addressLine1':
      return value.trim() ? undefined : 'กรุณากรอกที่อยู่';
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
