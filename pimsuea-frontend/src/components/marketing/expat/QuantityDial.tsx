import { Check, Shirt, X } from 'lucide-react';
import { useId } from 'react';
import { DIAL_MAX, SHOP_MINIMUM, useQuantityDial } from '@/hooks/useQuantityDial';
import { cn } from '@/lib/utils';

interface MoqCopy {
  sliderLabel: string;
  unit: string;
  shopName: string;
  shopNo: string;
  shopYes: string;
  usName: string;
  usYes: string;
  usPrice: string;
}

/** Interactive "how many do you need?" slider: shirt grid + shop vs PimSuea verdicts. */
export function QuantityDial({ copy }: { copy: MoqCopy }) {
  const { qty, setQty, shopAccepts } = useQuantityDial(12);
  const inputId = useId();
  const minMarkPct = ((SHOP_MINIMUM - 1) / (DIAL_MAX - 1)) * 100;

  return (
    <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/10 p-5 sm:p-7">
      <div className="flex items-end justify-between gap-4">
        <label htmlFor={inputId} className="text-sm font-semibold text-white/70">
          {copy.sliderLabel}
        </label>
        <p className="font-heavy text-5xl leading-none text-white tabular-nums" aria-live="polite">
          {qty}
          <span className="ml-1.5 font-sans text-sm font-semibold text-white/50">{copy.unit}</span>
        </p>
      </div>

      <div className="relative mt-5 mb-8">
        <input
          id={inputId}
          type="range"
          min={1}
          max={DIAL_MAX}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-full h-11 cursor-pointer accent-[#2FA4AF]"
        />
        <span
          className="pointer-events-none absolute top-full -mt-1 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider text-white/40 whitespace-nowrap"
          style={{ left: `${minMarkPct}%` }}
        >
          ↑ {SHOP_MINIMUM}+
        </span>
      </div>

      <div className="grid grid-cols-10 gap-1.5 sm:gap-2" aria-hidden="true">
        {Array.from({ length: DIAL_MAX }, (_, i) => (
          <Shirt
            key={i}
            strokeWidth={1.5}
            className={cn(
              'size-full max-w-6 mx-auto transition-colors duration-200',
              i < qty ? 'text-[#2FA4AF] fill-[#2FA4AF]/30' : 'text-white/15',
            )}
          />
        ))}
      </div>

      <dl className="mt-7 space-y-2.5">
        <div className="flex items-center gap-3 rounded-md bg-white/[0.04] px-4 py-3">
          <span
            className={cn(
              'grid size-7 shrink-0 place-items-center rounded-full transition-colors',
              shopAccepts ? 'bg-white/15 text-white' : 'bg-white/10 text-white/50',
            )}
          >
            {shopAccepts ? <Check className="size-4" /> : <X className="size-4" />}
          </span>
          <dt className="text-sm text-white/60 w-24 sm:w-32 shrink-0">{copy.shopName}</dt>
          <dd className="text-sm font-semibold text-white/80">{shopAccepts ? copy.shopYes : copy.shopNo}</dd>
        </div>
        <div className="flex items-center gap-3 rounded-md bg-primary/30 ring-1 ring-[#2FA4AF]/40 px-4 py-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#2FA4AF] text-[#121212]">
            <Check className="size-4" strokeWidth={3} />
          </span>
          <dt className="text-sm text-white w-24 sm:w-32 shrink-0 font-semibold">{copy.usName}</dt>
          <dd className="text-sm font-semibold text-white">
            {copy.usYes} <span className="text-white/60 font-normal">· {copy.usPrice}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
