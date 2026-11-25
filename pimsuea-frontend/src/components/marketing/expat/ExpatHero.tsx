import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalizedLink } from '@/components/LocalizedLink';
import { CUSTOM_SHIRTS_THAILAND_COPY } from '@/content/customShirtsThailandCopy';
import type { Language } from '@/i18n/types';
import { appUrl } from '@/lib/site';
import { StudioPreviewAnimation } from './StudioPreviewAnimation';

export const EXPAT_HERO_ID = 'expat-hero';

/** Split hero: big headline + CTAs on the left, looping studio demo on the right (below on mobile). */
export function ExpatHero({ lang }: { lang: Language }) {
  const copy = CUSTOM_SHIRTS_THAILAND_COPY[lang];

  return (
    <section
      id={EXPAT_HERO_ID}
      className="relative overflow-hidden border-b border-border"
      style={{
        backgroundImage: 'radial-gradient(rgba(8,99,109,0.12) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6 pt-10 pb-14 md:pt-20 md:pb-24 grid gap-12 md:grid-cols-[1.15fr_1fr] md:items-center">
        <div>
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-primary mb-5">{copy.eyebrow}</p>

          <h1 className="font-heavy text-[2.75rem] leading-[0.95] [&:lang(th)]:leading-[1.2] sm:text-6xl lg:text-7xl tracking-tight text-[#121212]">
            {copy.h1Lines.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? (
                  <span className="relative inline-block">
                    <span className="relative z-10 text-primary">{line}</span>
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-[0.08em] h-[0.28em] bg-primary/15 -z-0" />
                  </span>
                ) : (
                  line
                )}{' '}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#121212]/70">{copy.sub}</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href={appUrl('/catalog')} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-7 rounded-[4px] bg-action text-action-foreground hover:bg-action/90 font-bold text-base">
                {copy.ctaPrimary}
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </a>
            <LocalizedLink to="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 rounded-[4px] border-primary text-primary hover:bg-primary/5 font-semibold text-base bg-transparent">
                {copy.ctaSecondary}
              </Button>
            </LocalizedLink>
          </div>

          <ul className="mt-8 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-5 gap-y-2.5 text-sm font-medium text-[#121212]/80">
            {copy.chips.map((chip) => (
              <li key={chip} className="flex items-center gap-1.5">
                <Check className="size-4 text-primary shrink-0" strokeWidth={2.5} />
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <StudioPreviewAnimation copy={copy.demo} />
      </div>
    </section>
  );
}
