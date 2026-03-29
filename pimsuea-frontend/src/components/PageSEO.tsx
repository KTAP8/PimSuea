interface PageSEOProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
}

/**
 * Renders per-page SEO metadata.
 * React 19 automatically hoists <title>, <meta>, and <link> tags to <head>.
 * No external library required.
 */
export function PageSEO({
  title,
  description,
  canonical,
  ogImage = 'https://pimsuea.com/og-image.png',
}: PageSEOProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PimSuea" />
      <meta property="og:locale" content="th_TH" />
      <meta property="og:locale:alternate" content="en_US" />
      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {/* hreflang — bilingual site, same URL for Thai and English */}
      <link rel="alternate" hrefLang="th" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />
    </>
  );
}
