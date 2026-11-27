import { GEO_URLS } from '@/content/geoFacts';
import { CUSTOM_SHIRTS_THAILAND_COPY } from '@/content/customShirtsThailandCopy';
import { buildCaseNotesJsonLd, buildGeoJsonLd } from '@/lib/geoSchema';
import { CLOSING_CTA_ID, MarketingAnswerLayout } from '@/components/MarketingAnswerLayout';
import { ChatCompare } from '@/components/marketing/expat/ChatCompare';
import { CrewSegments } from '@/components/marketing/expat/CrewSegments';
import { DeliveryMap } from '@/components/marketing/expat/DeliveryMap';
import { DesignAccuracySection } from '@/components/marketing/expat/DesignAccuracySection';
import { EXPAT_HERO_ID, ExpatHero } from '@/components/marketing/expat/ExpatHero';
import { FaqAccordion } from '@/components/marketing/expat/FaqAccordion';
import { HowItWorksSteps } from '@/components/marketing/expat/HowItWorksSteps';
import { PainPointsIntro } from '@/components/marketing/expat/PainPointsIntro';
import { PriceSection } from '@/components/marketing/expat/PriceSection';
import { RealOrdersStrip } from '@/components/marketing/expat/RealOrdersStrip';
import { StickyMobileCta } from '@/components/marketing/expat/StickyMobileCta';
import { HolidayPromoPopup } from '@/components/marketing/HolidayPromoPopup';
import { useLandingLang } from '@/i18n/LanguageContext';

const EN = CUSTOM_SHIRTS_THAILAND_COPY.en;
const TH = CUSTOM_SHIRTS_THAILAND_COPY.th;

/** /custom-shirts-thailand — expat ad landing page. Layout and wiring only. */
export default function CustomShirtsThailandPage() {
  const { lang, t } = useLandingLang();
  const copy = CUSTOM_SHIRTS_THAILAND_COPY[lang];

  const faqs = [
    { q: t.faqQ7, a: t.faqA7 },
    { q: t.faqQ9, a: t.faqA9 },
    { q: copy.faqExtra.q, a: copy.faqExtra.a },
    { q: t.faqQ8, a: t.faqA8 },
    { q: t.faqQ10, a: t.faqA10 },
    { q: t.faqQ6, a: t.faqA6 },
    { q: t.faqQ5, a: t.faqA5 },
  ];

  const jsonLd = [
    buildGeoJsonLd({ lang, pageUrl: GEO_URLS.customShirtsThailand, pageName: EN.h1, faq: true }),
    buildCaseNotesJsonLd(),
  ];

  return (
    <MarketingAnswerLayout
      title={{ en: EN.title, th: TH.title }}
      description={{ en: EN.description, th: TH.description }}
      canonical={GEO_URLS.customShirtsThailand}
      jsonLd={jsonLd}
      closingCta={{
        title: { en: EN.closingTitle, th: TH.closingTitle },
        body: { en: EN.closingBody, th: TH.closingBody },
        button: { en: EN.ctaPrimary, th: TH.ctaPrimary },
      }}
    >
      <ExpatHero lang={lang} />
      <PainPointsIntro lang={lang} />
      <ChatCompare lang={lang} />
      <DesignAccuracySection lang={lang} />
      <HowItWorksSteps lang={lang} />
      <CrewSegments lang={lang} />
      <RealOrdersStrip lang={lang} />
      <PriceSection lang={lang} />
      <DeliveryMap lang={lang} />
      <FaqAccordion title={copy.faqTitle} items={faqs} />
      <StickyMobileCta
        heroId={EXPAT_HERO_ID}
        hideWhenVisibleId={CLOSING_CTA_ID}
        line={copy.stickyLine}
        cta={copy.ctaPrimary}
        fromLabel={copy.stickyFrom}
      />
      <HolidayPromoPopup />
    </MarketingAnswerLayout>
  );
}
