import { localizedUrl, SEO_ORIGIN, stripLangPrefix } from '@/content/marketingRoutes';
import { useRouteLang } from '@/i18n/LanguageContext';
import type { Language } from '@/i18n/types';
import { pickLocalized, type LocalizedText } from '@/i18n/localized';

interface PageSEOProps {
  title: LocalizedText;
  description: LocalizedText;
  /** English (root) canonical URL. The Thai URL is derived from it. */
  canonical: string;
  ogImage?: string;
}

const OG_ALT: Record<Language, string> = {
  en: 'PimSuea — custom shirts in Thailand, made simple.',
  th: 'PimSuea — สั่งทำเสื้อ ง่ายกว่าที่เคย',
};

function pathFromUrl(url: string): string {
  const path = url.startsWith(SEO_ORIGIN) ? url.slice(SEO_ORIGIN.length) : url;
  return stripLangPrefix(path || '/');
}

/**
 * Renders per-page SEO metadata.
 * React 19 automatically hoists <title>, <meta>, and <link> tags to <head>.
 * On marketing pages each language has its own URL: English at /x, Thai at /th/x.
 */
export function PageSEO({
  title,
  description,
  canonical,
  ogImage = 'https://pimsuea.com/og-image.png',
}: PageSEOProps) {
  const lang = useRouteLang() ?? 'en';
  const path = pathFromUrl(canonical);
  const enUrl = localizedUrl(path, 'en');
  const thUrl = localizedUrl(path, 'th');
  const selfUrl = lang === 'th' ? thUrl : enUrl;
  const titleText = pickLocalized(title, lang);
  const descriptionText = pickLocalized(description, lang);

  return (
    <>
      <title>{titleText}</title>
      <meta name="description" content={descriptionText} />
      <link rel="canonical" href={selfUrl} />
      {/* Open Graph */}
      <meta property="og:title" content={titleText} />
      <meta property="og:description" content={descriptionText} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={OG_ALT[lang]} />
      <meta property="og:url" content={selfUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PimSuea" />
      <meta property="og:locale" content={lang === 'th' ? 'th_TH' : 'en_US'} />
      <meta property="og:locale:alternate" content={lang === 'th' ? 'en_US' : 'th_TH'} />
      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={titleText} />
      <meta name="twitter:description" content={descriptionText} />
      <meta name="twitter:image" content={ogImage} />
      {/* hreflang: English at root, Thai under /th */}
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="th" href={thUrl} />
      <link rel="alternate" hrefLang="x-default" href={enUrl} />
    </>
  );
}
