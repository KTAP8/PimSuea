import { Ruler, Send, ShieldCheck } from 'lucide-react';
import { EXPAT_PAIN_POINTS_COPY } from '@/content/expatPainPointsCopy';
import type { Language } from '@/i18n/types';
import { MockupCompare } from './MockupCompare';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const ICONS = [Ruler, Send, ShieldCheck];

/** Pain point 3 (design inconsistency): before/after compare + three proof points. */
export function DesignAccuracySection({ lang }: { lang: Language }) {
  const copy = EXPAT_PAIN_POINTS_COPY[lang].design;

  return (
    <section className="bg-[#F8F9FA] border-y border-[#E9ECEF]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 grid gap-10 md:grid-cols-2 md:gap-16 md:items-center">
        <Reveal className="md:order-2">
          <SectionHeading label={copy.label} title={copy.title} body={copy.body} />
          <ul className="mt-8 space-y-5">
            {copy.points.map((point, i) => {
              const Icon = ICONS[i];
              return (
                <li key={point.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block font-bold text-[#121212]">{point.title}</span>
                    <span className="block text-sm leading-relaxed text-[#121212]/65">{point.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal className="md:order-1" delay={100}>
          <MockupCompare copy={copy} />
          <p className="mt-3 text-center text-xs text-[#6C757D]">← {copy.dragHint} →</p>
        </Reveal>
      </div>
    </section>
  );
}
