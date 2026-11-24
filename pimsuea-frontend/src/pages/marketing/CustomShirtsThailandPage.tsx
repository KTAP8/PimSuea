import { ArrowRight, Globe, MapPin } from 'lucide-react';
import { GEO, GEO_URLS } from '@/content/geoFacts';
import { CUSTOM_SHIRTS_THAILAND_COPY } from '@/content/customShirtsThailandCopy';
import { buildCaseNotesJsonLd, buildGeoJsonLd } from '@/lib/geoSchema';
import { AnswerH1, FactList, MarketingAnswerLayout } from '@/components/MarketingAnswerLayout';
import { FaqList } from '@/components/marketing/FaqList';
import { Button } from '@/components/ui/button';
import { LocalizedLink } from '@/components/LocalizedLink';
import { useLandingLang } from '@/i18n/LanguageContext';
import { appUrl } from '@/lib/site';

export default function CustomShirtsThailandPage() {
  const { lang, t } = useLandingLang();
  const copy = CUSTOM_SHIRTS_THAILAND_COPY[lang];
  const en = lang === 'en';
  const faqs = [
    { q: t.faqQ7, a: t.faqA7 },
    { q: t.faqQ9, a: t.faqA9 },
    { q: t.faqQ8, a: t.faqA8 },
    { q: t.faqQ10, a: t.faqA10 },
    { q: t.faqQ6, a: t.faqA6 },
    { q: t.faqQ5, a: t.faqA5 },
  ];

  const jsonLd = [
    buildGeoJsonLd({
      lang,
      pageUrl: GEO_URLS.customShirtsThailand,
      pageName: CUSTOM_SHIRTS_THAILAND_COPY.en.h1,
      faq: true,
    }),
    buildCaseNotesJsonLd(),
  ];

  return (
    <MarketingAnswerLayout
      title={{ en: CUSTOM_SHIRTS_THAILAND_COPY.en.title, th: CUSTOM_SHIRTS_THAILAND_COPY.th.title }}
      description={{
        en: CUSTOM_SHIRTS_THAILAND_COPY.en.description,
        th: CUSTOM_SHIRTS_THAILAND_COPY.th.description,
      }}
      canonical={GEO_URLS.customShirtsThailand}
      jsonLd={jsonLd}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            <Globe className="w-3.5 h-3.5" />
            {copy.badge}
          </div>
          <AnswerH1 en={CUSTOM_SHIRTS_THAILAND_COPY.en.h1} th={CUSTOM_SHIRTS_THAILAND_COPY.th.h1} />
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">{copy.intro}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={appUrl('/catalog')}>
              <Button className="bg-action text-action-foreground font-bold">
                {en ? 'Open studio' : 'เปิดสตูดิโอ'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <LocalizedLink to="/pricing">
              <Button variant="outline">{en ? 'See price list' : 'ดูตารางราคา'}</Button>
            </LocalizedLink>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="font-black text-2xl">{copy.factsTitle}</h2>
          <FactList items={[...copy.facts]} />
        </section>

        <section className="space-y-4">
          <h2 className="font-black text-2xl">{copy.stepsTitle}</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {copy.steps.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-border p-5 bg-card/70">
                <p className="text-xs font-bold text-primary mb-2">0{i + 1}</p>
                <h3 className="font-bold mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3 max-w-3xl">
          <h2 className="font-black text-2xl">{copy.whyTitle}</h2>
          {copy.why.map((line) => (
            <p key={line} className="text-muted-foreground font-light leading-relaxed">{line}</p>
          ))}
        </section>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-12">
        <section className="space-y-3">
          <h2 className="font-black text-2xl">{copy.citiesTitle}</h2>
          <p className="text-muted-foreground font-light">{copy.citiesBody}</p>
          <ul className="flex flex-wrap gap-2">
            {GEO.location.cities.map((city) => (
              <li
                key={city}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                {city}
              </li>
            ))}
          </ul>
        </section>

        <FaqList title={copy.faqTitle} items={faqs} />
      </div>
    </MarketingAnswerLayout>
  );
}
