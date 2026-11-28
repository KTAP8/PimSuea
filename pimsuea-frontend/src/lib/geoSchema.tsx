import {
  CASE_NOTES,
  faqSchemaEntries,
  GEO,
  GEO_URLS,
  geoSameAs,
} from '@/content/geoFacts';
import { translations } from '@/translations/landing';
import { localizedUrl, stripLangPrefix } from '@/content/marketingRoutes';
import type { Language } from '@/i18n/types';

/** Build Organization + LocalBusiness + FAQPage JSON-LD graph for marketing pages. */
export function buildGeoJsonLd(options?: {
  faq?: boolean;
  pageUrl?: string;
  pageName?: string;
  /** Page language; the Thai variant's URL is /th/... */
  lang?: Language;
}): Record<string, unknown> {
  const lang = options?.lang ?? 'en';
  const basePath = stripLangPrefix(
    (options?.pageUrl ?? GEO_URLS.home).replace(GEO.website, '') || '/',
  );
  const pageUrl = localizedUrl(basePath, lang);
  const sameAs = geoSameAs();
  const brandImage = {
    '@type': 'ImageObject',
    url: `${GEO.website}/og-image.png`,
    width: 1200,
    height: 630,
    caption: 'PimSuea — custom shirts, made simple',
  };

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${GEO.website}/#organization`,
      name: GEO.brand,
      url: GEO.website,
      logo: `${GEO.website}/logo.svg`,
      image: brandImage,
      description: GEO.oneLiner,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: GEO_URLS.line,
        availableLanguage: ['English', 'Thai'],
        areaServed: GEO.location.areaServed,
      },
      sameAs,
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${GEO.website}/#localbusiness`,
      name: GEO.brand,
      url: GEO.website,
      image: brandImage,
      description: GEO.oneLiner,
      address: {
        '@type': 'PostalAddress',
        addressLocality: GEO.location.city,
        addressCountry: GEO.location.country,
      },
      areaServed: [
        { '@type': 'Country', name: GEO.location.country },
        ...GEO.location.cities.map((name) => ({ '@type': 'City', name })),
      ],
      priceRange: '฿฿',
      paymentAccepted: GEO.payments.filter((p) => p !== 'THB').join(', '),
      currenciesAccepted: 'THB',
      knowsLanguage: GEO.languages,
      audience: GEO.audiences.map((audienceType) => ({ '@type': 'Audience', audienceType })),
      sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': `${GEO.website}/#website`,
      name: GEO.brand,
      url: GEO.website,
      publisher: { '@id': `${GEO.website}/#organization` },
      inLanguage: ['en', 'th'],
    },
  ];

  if (options?.pageUrl && options.pageName) {
    graph.push({
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: options.pageName,
      primaryImageOfPage: brandImage,
      isPartOf: { '@id': `${GEO.website}/#website` },
      about: { '@id': `${GEO.website}/#organization` },
      inLanguage: lang,
    });
  }

  if (options?.faq !== false) {
    const t = translations[lang];
    const landingFaqs = [
      { q: t.faqQ1, a: t.faqA1 },
      { q: t.faqQ2, a: t.faqA2 },
      { q: t.faqQ3, a: t.faqA3 },
      { q: t.faqQ4, a: t.faqA4 },
      { q: t.faqQ5, a: t.faqA5 },
      { q: t.faqQ6, a: t.faqA6 },
      { q: t.faqQ7, a: t.faqA7 },
      { q: t.faqQ8, a: t.faqA8 },
      { q: t.faqQ9, a: t.faqA9 },
      { q: t.faqQ10, a: t.faqA10 },
    ];
    const faqEntries =
      landingFaqs.length > 0 ? landingFaqs : faqSchemaEntries().map((f) => ({ q: f.question, a: f.answer }));

    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: faqEntries.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/** Case-study ItemList for /print-on-demand. */
export function buildCaseNotesJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'PimSuea customer orders',
    itemListElement: CASE_NOTES.map((note, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: note.name,
        description: note.summaryEn,
        datePublished: `${note.year}`,
      },
    })),
  };
}

/** Offer catalog snapshot for /pricing. */
export function buildPricingOfferJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'PimSuea DTG print-on-demand pricing',
    url: GEO_URLS.pricing,
    validFrom: GEO.pricingSnapshotDate,
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Classic DTG tee (White, qty 1–11)',
        price: '199',
        priceCurrency: 'THB',
      },
      {
        '@type': 'Offer',
        name: 'DTG print 3×4" tier (White, qty 1–11)',
        price: '99',
        priceCurrency: 'THB',
      },
      {
        '@type': 'Offer',
        name: 'Essential long sleeve cotton tee (White, qty 1–11)',
        price: '450',
        priceCurrency: 'THB',
      },
    ],
  };
}

export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
