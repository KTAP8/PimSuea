import type { Language } from './types';

export function dateLocale(lang: Language): string {
  return lang === 'en' ? 'en-US' : 'th-TH';
}

export function formatDate(
  lang: Language,
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(dateLocale(lang), options);
}

export function formatMoney(amount: number, lang: Language): string {
  return `฿${amount.toLocaleString(dateLocale(lang))}`;
}
