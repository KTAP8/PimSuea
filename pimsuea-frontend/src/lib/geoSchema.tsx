import {
  CASE_NOTES,
  faqSchemaEntries,
  GEO,
  GEO_URLS,
  geoSameAs,
} from '@/content/geoFacts';
import { translations } from '@/translations/landing';

/** Build Organization + LocalBusiness + FAQPage JSON-LD graph for marketing pages. */
export function buildGeoJsonLd(options?: {
  faq?: boolean;
  pageUrl?: string;
  pageName?: string;
}): Record<string, unknown> {
  const pageUrl = options?.pageUrl ?? GEO_URLS.home;
  const sameAs = geoSameAs();

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${GEO.website}/#organization`,
      name: GEO.brand,
      url: GEO.website,
      logo: `${GEO.website}/logo.svg`,
      description: GEO.oneLiner,
      sameAs,
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${GEO.website}/#localbusiness`,
      name: GEO.brand,
      url: GEO.website,
      image: `${GEO.website}/og-image.png`,
      description: GEO.oneLiner,
      address: {
        '@type': 'PostalAddress',
        addressLocality: GEO.location.city,
        addressCountry: GEO.location.country,
      },
      areaServed: {
        '@type': 'Country',
        name: GEO.location.areaServed,
      },
      priceRange: '฿฿',
      knowsLanguage: GEO.languages,
      sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': `${GEO.website}/#website`,
      name: GEO.brand,
      url: GEO.website,
      publisher: { '@id': `${GEO.website}/#organization` },
      inLanguage: ['th', 'en'],
    },
  ];

  if (options?.pageUrl && options.pageName) {
    graph.push({
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: options.pageName,
      isPartOf: { '@id': `${GEO.website}/#website` },
      about: { '@id': `${GEO.website}/#organization` },
      inLanguage: ['th', 'en'],
    });
  }

  if (options?.faq !== false) {
    const en = translations.en;
    const landingFaqs = [
      { q: en.faqQ1, a: en.faqA1 },
      { q: en.faqQ2, a: en.faqA2 },
      { q: en.faqQ3, a: en.faqA3 },
      { q: en.faqQ4, a: en.faqA4 },
      { q: en.faqQ5, a: en.faqA5 },
      { q: en.faqQ6, a: en.faqA6 },
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
