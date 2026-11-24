import type { Language } from './types';

/** A string, or one string per language. */
export type LocalizedText = string | Record<Language, string>;

export function pickLocalized(text: LocalizedText, lang: Language): string {
  return typeof text === 'string' ? text : text[lang];
}
