export const ACTIVE_PRINTING_TYPES = ['DTG'] as const;
export type ActivePrintingType = (typeof ACTIVE_PRINTING_TYPES)[number];

export function isLegacyDtfPrintingType(type: string | null | undefined): boolean {
  return type?.toUpperCase() === 'DTF';
}

export function isLegacyDtfPrintMethod(
  method: { id?: string; name?: string } | null | undefined,
): boolean {
  if (!method) return false;
  const id = String(method.id ?? '').toLowerCase();
  const name = String(method.name ?? '').toUpperCase();
  return (
    id === 'dtf'
    || id.includes('dtf')
    || name === 'DTF'
    || name.includes('DTF')
    || name.includes('DIRECT TO FILM')
    || name.includes('DIRECT-TO-FILM')
  );
}

export function filterActivePrintMethods<T extends { id?: string; name?: string }>(
  methods: T[] | null | undefined,
): T[] {
  return (methods ?? []).filter(m => !isLegacyDtfPrintMethod(m));
}

export { dtfDiscontinuedMessage } from '@/translations/app/checkout';

/** Compact label for badges in narrow product cards */
export function getPrintMethodShortLabel(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('DTG') || upper.includes('DIRECT TO GARMENT')) return 'DTG';
  if (upper.includes('DTF') || upper.includes('DIRECT TO FILM')) return 'DTF';
  if (name.length <= 8) return upper;
  return upper.split(/[\s(]/)[0] ?? upper.slice(0, 8);
}
