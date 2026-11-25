import { ArrowRight } from 'lucide-react';
import { LocalizedLink } from '@/components/LocalizedLink';
import { EXPAT_SEGMENTS_COPY } from '@/content/expatSegmentsCopy';
import type { Language } from '@/i18n/types';

const ZIGZAG = {
  WebkitMask: 'conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 16px 100%',
  mask: 'conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 16px 100%',
};

/** Receipt-style card showing a real one-shirt order total (prices from geoFacts). */
export function PriceReceipt({ lang }: { lang: Language }) {
  const r = EXPAT_SEGMENTS_COPY[lang].receipt;

  return (
    <div className="relative mx-auto w-full max-w-sm -rotate-1 drop-shadow-[0_18px_30px_rgba(18,18,18,0.18)]">
      <div className="bg-white px-6 pt-6 pb-10" style={ZIGZAG}>
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#6C757D]">{r.heading}</p>
        <div className="my-4 border-t border-dashed border-[#CED4DA]" />
        <dl className="space-y-2.5 text-sm tabular-nums">
          {r.lines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4">
              <dt className="text-[#121212]/70">{line.label}</dt>
              <dd className="font-semibold text-[#121212]">฿{line.thb}</dd>
            </div>
          ))}
        </dl>
        <div className="my-4 border-t border-dashed border-[#CED4DA]" />
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-[#121212]">{r.total}</span>
          <span className="font-heavy text-4xl text-primary tabular-nums">฿{r.totalThb}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm tabular-nums text-[#121212]/60">
          <span>{r.delivery}</span>
          <span>฿{r.deliveryThb}</span>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-[#6C757D]">{r.note}</p>
        <LocalizedLink to="/pricing" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {r.link}
          <ArrowRight className="size-3.5" />
        </LocalizedLink>
      </div>
    </div>
  );
}
