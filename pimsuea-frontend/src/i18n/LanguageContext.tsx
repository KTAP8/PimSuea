import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { appTranslations, type AppTranslations } from '@/translations/app';
import { DEFAULT_LANGUAGE, type Language } from './types';
import { readStoredLanguage, writeStoredLanguage } from './storage';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: AppTranslations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: appTranslations[DEFAULT_LANGUAGE],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => readStoredLanguage());

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    writeStoredLanguage(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: appTranslations[lang],
    }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Marketing pages that only need landing copy + lang toggle */
export function useLandingLang() {
  const { lang, setLang, t } = useLanguage();
  return { lang, setLang, t: t.landing };
}

/** Marketing answer pages */
export function useMarketingLang() {
  const { lang, setLang } = useLanguage();
  return { lang, setLang };
}
