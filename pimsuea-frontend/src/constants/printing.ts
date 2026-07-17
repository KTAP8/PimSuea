export const ACTIVE_PRINTING_TYPES = ['DTG'] as const;
export type ActivePrintingType = (typeof ACTIVE_PRINTING_TYPES)[number];

export function isLegacyDtfPrintingType(type: string | null | undefined): boolean {
  return type?.toUpperCase() === 'DTF';
}

export const DTF_DISCONTINUED_MESSAGE =
  'เราไม่รับงานพิมพ์ DTF แล้ว กรุณาสร้างดีไซน์ใหม่ด้วย DTG';
