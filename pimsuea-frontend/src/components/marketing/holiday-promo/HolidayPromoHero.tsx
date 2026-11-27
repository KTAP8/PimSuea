import { motion } from 'framer-motion';
import { Sparkle } from 'lucide-react';
import type { HolidayPromoCopy } from '@/content/holidayPromoCopy';
import { ConfettiBurst } from './ConfettiBurst';
import { RotatingBadge } from './RotatingBadge';

interface Props {
  copy: HolidayPromoCopy;
  reducedMotion: boolean;
}

const SPARKLES = [
  { className: 'top-8 right-20 size-3', delay: '0s' },
  { className: 'bottom-10 right-8 size-4', delay: '0.7s' },
  { className: 'top-1/2 left-[58%] size-2.5', delay: '1.3s' },
];

/** Teal top half of the promo card: eyebrow, giant discount, stamp, badge. Purely visual. */
export function HolidayPromoHero({ copy, reducedMotion }: Props) {
  return (
    <div aria-hidden className="relative overflow-hidden bg-[#08636D] px-6 pt-7 pb-8 text-[#F8F9FA] sm:px-8">
      {/* halftone print texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(248,249,250,0.14)_1px,transparent_1.6px)] bg-[size:12px_12px] [mask-image:linear-gradient(135deg,black,transparent_75%)]" />
      {/* warm glow */}
      <div className="absolute -bottom-20 -left-16 size-56 rounded-full bg-[#F05A25]/35 blur-3xl" />

      {SPARKLES.map((s) => (
        <Sparkle
          key={s.className}
          className={`animate-twinkle absolute fill-[#FFC93C] text-[#FFC93C] ${s.className}`}
          style={{ animationDelay: s.delay }}
        />
      ))}

      <div className="relative">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#F8F9FA]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ring-1 ring-[#F8F9FA]/20">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#FFC93C] opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-[#FFC93C]" />
          </span>
          {copy.eyebrow}
        </p>

        <div className="relative mt-4 flex items-end gap-3">
          {!reducedMotion && <ConfettiBurst />}
          <motion.span
            initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.15 }}
            className="relative font-[vision-heavy] text-[6.5rem] leading-[0.78] tracking-[-0.04em] sm:text-[8rem]"
          >
            {copy.discount}
          </motion.span>
          <motion.span
            initial={reducedMotion ? false : { scale: 2.2, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: -10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.45 }}
            className="relative mb-2 rounded-md border-2 border-[#F8F9FA] bg-[#F05A25] px-2.5 py-1 font-black text-2xl tracking-wider shadow-[3px_3px_0_#121212] sm:text-3xl"
          >
            {copy.stamp}
          </motion.span>
        </div>

        <p className="mt-4 max-w-[14rem] text-lg font-bold leading-snug text-[#F8F9FA]/90 sm:max-w-[17rem] sm:text-xl">
          {copy.subline}
        </p>
      </div>

      <div className="absolute -right-5 -bottom-7 rotate-12 sm:-right-3 sm:-bottom-5">
        <RotatingBadge text={copy.badge} />
      </div>
    </div>
  );
}
