import { AnimatePresence, motion } from 'framer-motion';
import { ImageUp, MousePointer2 } from 'lucide-react';
import { DTG_PRINT_QTY1_11, GARMENT_PRICING } from '@/content/geoFacts';
import { useStudioDemoLoop } from '@/hooks/useStudioDemoLoop';
import { cn } from '@/lib/utils';
import { CrewBadgeArt } from './CrewBadgeArt';
import { ShirtSvg } from './ShirtSvg';

interface DemoCopy {
  toolbar: string;
  hint: string;
  qty: string;
  perPiece: string;
  file: string;
}

const TEE = GARMENT_PRICING[0].colors[0].thb;
const PRICE_BY_TIER = { A5: TEE + DTG_PRINT_QTY1_11.white[1].thb, '3×4': TEE + DTG_PRINT_QTY1_11.white[0].thb };
const TIERS = ['3×4', 'A5', 'A4', 'A3'] as const;

const LOGO_POSE = {
  0: { left: '50%', top: '4%', width: '30%', opacity: 0 },
  1: { left: '50%', top: '46%', width: '34%', opacity: 1 },
  2: { left: '61%', top: '36%', width: '15%', opacity: 1 },
  3: { left: '61%', top: '36%', width: '15%', opacity: 1 },
} as const;

/** Looping, illustrated "studio" in the hero: drop logo → see size → resize → price updates. */
export function StudioPreviewAnimation({ copy }: { copy: DemoCopy }) {
  const stage = useStudioDemoLoop();
  const tier = stage === 1 ? 'A5' : stage >= 2 ? '3×4' : null;
  const price = tier ? PRICE_BY_TIER[tier] : null;
  const dims = tier === 'A5' ? 'A5 · 6 × 8 in' : '3 × 4 in';

  return (
    <div className="relative w-full max-w-md mx-auto rounded-lg border border-[#121212]/10 bg-white shadow-[0_24px_60px_-20px_rgba(18,18,18,0.35)] overflow-hidden">
      <div className="flex items-center gap-2 bg-[#121212] px-4 py-2.5 text-white">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/25" />
          <span className="size-2.5 rounded-full bg-white/25" />
          <span className="size-2.5 rounded-full bg-white/25" />
        </span>
        <span className="ml-2 text-xs font-semibold tracking-wide">{copy.toolbar}</span>
        <span className="ml-auto flex gap-1" aria-hidden="true">
          {TIERS.map((t) => (
            <span
              key={t}
              className={cn(
                'rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold transition-colors duration-300',
                t === tier ? 'bg-primary text-white' : 'bg-white/10 text-white/60',
              )}
            >
              {t}
            </span>
          ))}
        </span>
      </div>

      <div
        className="relative px-8 pt-6 pb-16"
        style={{
          backgroundColor: '#F3F4F6',
          backgroundImage:
            'linear-gradient(45deg,#E9ECEF 25%,transparent 25%),linear-gradient(-45deg,#E9ECEF 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E9ECEF 75%),linear-gradient(-45deg,transparent 75%,#E9ECEF 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
        }}
      >
        <div className="relative">
          <ShirtSvg />

          <AnimatePresence>
            {stage === 0 && (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 rounded-md border-2 border-dashed border-primary/40 px-4 py-3 text-primary"
              >
                <ImageUp className="size-5" strokeWidth={1.75} />
                <span className="text-[11px] font-semibold whitespace-nowrap">{copy.hint}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            initial={false}
            animate={LOGO_POSE[stage]}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          >
            <div className={cn('relative p-1 transition-[outline-color] duration-300 outline-1 outline-dashed', tier ? 'outline-primary' : 'outline-transparent')}>
              <CrewBadgeArt />
              {tier &&
                ['-left-1 -top-1', '-right-1 -top-1', '-left-1 -bottom-1', '-right-1 -bottom-1'].map((pos) => (
                  <span key={pos} className={cn('absolute size-2 bg-white border border-primary', pos)} />
                ))}
              {stage === 2 && (
                <MousePointer2 className="absolute -right-4 -bottom-5 size-5 fill-[#121212] text-white drop-shadow" />
              )}
            </div>
            {tier && (
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                {dims}
              </span>
            )}
          </motion.div>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-md bg-white/95 px-3 py-2 shadow-sm ring-1 ring-black/5">
          <span className="text-xs font-semibold text-muted-foreground">{copy.qty}</span>
          <span className="flex items-baseline gap-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={price ?? 'none'}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="font-heavy text-2xl leading-none text-[#121212] tabular-nums"
              >
                {price ? `฿${price}` : '฿—'}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs text-muted-foreground">{copy.perPiece}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
