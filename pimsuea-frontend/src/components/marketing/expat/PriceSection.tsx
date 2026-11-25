import { EXPAT_SEGMENTS_COPY } from '@/content/expatSegmentsCopy';
import type { Language } from '@/i18n/types';
import { CompareTable } from './CompareTable';
import { PriceReceipt } from './PriceReceipt';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

/** Price transparency (receipt) + comparison with print shops and overseas sites. */
export function PriceSection({ lang }: { lang: Language }) {
  const copy = EXPAT_SEGMENTS_COPY[lang];

  return (
    <section className="bg-[#F8F9FA] border-b border-[#E9ECEF]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 space-y-16 md:space-y-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <Reveal>
            <SectionHeading label={copy.priceKicker} title={copy.priceTitle} body={copy.priceBody} />
          </Reveal>
          <Reveal delay={120}>
            <PriceReceipt lang={lang} />
          </Reveal>
        </div>
        <Reveal>
          <CompareTable lang={lang} />
        </Reveal>
      </div>
    </section>
  );
}
