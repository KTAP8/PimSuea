import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { EXPAT_SEGMENTS_COPY } from '@/content/expatSegmentsCopy';
import { usePrefersReducedMotionAfterMount } from '@/hooks/usePrefersReducedMotionAfterMount';
import type { Language } from '@/i18n/types';
import { SectionHeading } from './SectionHeading';

/** Dark marquee of real customer orders (real photos only, quantities from CASE_NOTES). */
export function RealOrdersStrip({ lang }: { lang: Language }) {
  const copy = EXPAT_SEGMENTS_COPY[lang];
  const reduced = usePrefersReducedMotionAfterMount();

  const cards = copy.orders.map((order) => (
    <figure key={order.src} className="w-60 sm:w-72 shrink-0">
      <img
        src={order.src}
        alt={order.name}
        loading="lazy"
        decoding="async"
        className="aspect-[4/5] w-full object-cover bg-white/5"
      />
      <figcaption className="mt-3 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-white">{order.name}</span>
        <span className="text-white/50 tabular-nums">{order.qty}</span>
      </figcaption>
    </figure>
  ));

  return (
    <section className="bg-[#121212] py-16 md:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <SectionHeading tone="dark" label={copy.ordersKicker} title={copy.ordersTitle} />
      </div>
      <div className="relative mt-10 overflow-hidden">
        {reduced ? (
          <div className="flex gap-5 overflow-x-auto px-5 sm:px-6 snap-x">{cards}</div>
        ) : (
          <InfiniteSlider gap={20} speed={30} speedOnHover={8}>
            {cards}
          </InfiniteSlider>
        )}
      </div>
    </section>
  );
}
