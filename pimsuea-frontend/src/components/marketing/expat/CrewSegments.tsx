import { ArrowRight } from 'lucide-react';
import { LocalizedLink } from '@/components/LocalizedLink';
import { EXPAT_SEGMENT_IMAGES, EXPAT_SEGMENTS_COPY } from '@/content/expatSegmentsCopy';
import type { Language } from '@/i18n/types';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

/** "Made for your crew": bento grid on desktop, swipeable carousel on mobile. */
export function CrewSegments({ lang }: { lang: Language }) {
  const copy = EXPAT_SEGMENTS_COPY[lang];

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading label={copy.crewKicker} title={copy.crewTitle} />
          <LocalizedLink
            to="/club-and-gift-shirts"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {copy.crewLink}
            <ArrowRight className="size-4" />
          </LocalizedLink>
        </div>

        <ul className="-mx-5 px-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:grid-rows-2 md:gap-5 md:overflow-visible md:h-[640px]">
          {copy.segments.map((seg, i) => (
            <li
              key={seg.key}
              className={cn(
                'relative w-[78%] shrink-0 snap-start aspect-[4/5] md:w-auto md:aspect-auto',
                i === 0 && 'md:row-span-2',
              )}
            >
              <Reveal delay={i * 80} className="group relative h-full overflow-hidden rounded-lg bg-[#121212]">
                <img
                  src={EXPAT_SEGMENT_IMAGES[seg.key]}
                  alt={seg.alt}
                  loading="lazy"
                  decoding="async"
                  width={896}
                  height={1120}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="inline-block rounded-[4px] bg-white/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                    {seg.tag}
                  </span>
                  <p className={cn('mt-2 font-heavy leading-tight text-white', i === 0 ? 'text-3xl md:text-4xl' : 'text-2xl')}>
                    {seg.hook}
                  </p>
                  <p className="mt-1.5 text-sm text-white/70">{seg.qty}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
