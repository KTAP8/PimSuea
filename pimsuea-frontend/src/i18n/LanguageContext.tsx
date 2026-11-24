import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { appTranslations, type AppTranslations } from '@/translations/app';
import { localizedPath } from '@/content/marketingRoutes';
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

/** Non-null only inside marketing pages, where the language comes from the URL. */
const RouteLanguageContext = createContext<Language | null>(null);

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

/**
 * Marketing pages: language is fixed by the URL (/ = English, /th = Thai).
 * Switching language navigates to the paired URL and stores the choice so the app follows.
 */
export function RouteLanguageProvider({ lang, children }: { lang: Language; children: ReactNode }) {
  const parent = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang: parentLang, setLang: setParentLang } = parent;

  useEffect(() => {
    if (parentLang !== lang) setParentLang(lang);
  }, [lang, parentLang, setParentLang]);

  const setLang = useCallback(
    (next: Language) => {
      setParentLang(next);
      if (next !== lang) {
        navigate(localizedPath(location.pathname, next) + location.hash);
      }
    },
    [lang, location.pathname, location.hash, navigate, setParentLang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t: appTranslations[lang] }),
    [lang, setLang],
  );

  return (
    <RouteLanguageContext.Provider value={lang}>
      <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
    </RouteLanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Language from the marketing URL, or null outside marketing pages. */
export function useRouteLang() {
  return useContext(RouteLanguageContext);
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
