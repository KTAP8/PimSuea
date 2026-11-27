import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface Props {
  code: string;
  label: string;
  tapToCopy: string;
  copied: string;
}

/** Tear-off coupon stub: tap anywhere to copy the code. */
export function PromoCodeTicket({ code, label, tapToCopy, copied: copiedLabel }: Props) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => void copy(code)}
      className="group relative flex w-full items-center justify-between gap-3 rounded-lg border-2 border-dashed border-[#F05A25]/45 bg-[#FFF3EC] px-5 py-3.5 text-left sm:px-6 transition-colors hover:bg-[#FFEADF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A25]"
    >
      {/* punched notches */}
      <span aria-hidden className="absolute top-1/2 -left-3 size-5 -translate-y-1/2 rounded-full bg-[#F8F9FA]" />
      <span aria-hidden className="absolute top-1/2 -right-3 size-5 -translate-y-1/2 rounded-full bg-[#F8F9FA]" />

      <span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#F05A25]">
          {label}
        </span>
        <motion.span
          key={copied ? 'c' : 'n'}
          initial={copied ? { scale: 1.08 } : false}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="block origin-left font-black text-[1.35rem] leading-tight tracking-[0.1em] sm:text-[1.7rem] sm:tracking-[0.14em] text-[#121212]"
        >
          {code}
        </motion.span>
      </span>

      <span
        aria-live="polite"
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold sm:px-3 transition-colors ${
          copied ? 'bg-[#08636D] text-[#F8F9FA]' : 'bg-[#121212] text-[#F8F9FA] group-hover:bg-[#F05A25]'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'done' : 'idle'}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            {copied ? <Check className="size-3.5" strokeWidth={3} /> : <Copy className="size-3.5" />}
            <span className={copied ? '' : 'sr-only sm:not-sr-only'}>{copied ? copiedLabel : tapToCopy}</span>
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
