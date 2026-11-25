import { CUSTOM_SHIRTS_THAILAND_COPY } from '@/content/customShirtsThailandCopy';
import { useRevealOnView } from '@/hooks/useRevealOnView';
import type { Language } from '@/i18n/types';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

/** Three numbered steps. Desktop: a row with a line that draws in. Mobile: snap-scrolling cards. */
export function HowItWorksSteps({ lang }: { lang: Language }) {
  const copy = CUSTOM_SHIRTS_THAILAND_COPY[lang];
  const { ref, visible } = useRevealOnView<HTMLDivElement>(0.3);

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24">
        <SectionHeading title={copy.stepsTitle} />

        <div ref={ref} className="relative mt-10 md:mt-14">
          <span
            aria-hidden="true"
            className={cn(
              'hidden md:block absolute left-0 right-0 top-7 h-0.5 origin-left bg-primary/25 transition-transform duration-[1200ms] ease-out motion-reduce:transition-none',
              visible ? 'scale-x-100' : 'scale-x-0',
            )}
          />
          <ol className="-mx-5 px-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible">
            {copy.steps.map((step, i) => (
              <li
                key={step.title}
                className={cn(
                  'relative w-[78%] shrink-0 snap-start rounded-lg border border-[#E9ECEF] bg-[#F8F9FA] p-6 md:w-auto md:border-0 md:bg-transparent md:p-0',
                  'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
                )}
                style={{ transitionDelay: visible ? `${200 + i * 180}ms` : '0ms' }}
              >
                <span className="relative z-10 grid size-14 place-items-center rounded-full bg-[#121212] font-heavy text-2xl text-white ring-8 ring-white md:ring-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-xl font-bold text-[#121212]">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#121212]/65">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
