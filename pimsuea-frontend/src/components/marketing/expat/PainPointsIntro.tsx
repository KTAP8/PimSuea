import { EXPAT_PAIN_POINTS_COPY } from '@/content/expatPainPointsCopy';
import type { Language } from '@/i18n/types';
import { QuantityDial } from './QuantityDial';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

/** Dark band: the "usual way vs PimSuea" intro + pain point 1 (minimum orders). */
export function PainPointsIntro({ lang }: { lang: Language }) {
  const copy = EXPAT_PAIN_POINTS_COPY[lang];

  return (
    <section className="bg-[#121212] text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{copy.introKicker}</p>
          <p className="mt-3 max-w-3xl font-heavy text-3xl sm:text-4xl leading-tight text-white/90">{copy.introTitle}</p>
        </Reveal>

        <div className="mt-14 md:mt-20 grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <Reveal>
            <SectionHeading tone="dark" label={copy.moq.label} title={copy.moq.title} body={copy.moq.body} />
          </Reveal>
          <Reveal delay={120}>
            <QuantityDial copy={copy.moq} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
