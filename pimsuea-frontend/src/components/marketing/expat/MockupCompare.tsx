import { ChevronsLeftRight } from 'lucide-react';
import { useBeforeAfterSlider } from '@/hooks/useBeforeAfterSlider';
import { CrewBadgeArt } from './CrewBadgeArt';
import { ShirtSvg } from './ShirtSvg';

interface CompareCopy {
  before: string;
  beforeNote: string;
  after: string;
  dragHint: string;
}

const CHECKER = {
  backgroundColor: '#F3F4F6',
  backgroundImage:
    'linear-gradient(45deg,#E9ECEF 25%,transparent 25%),linear-gradient(-45deg,#E9ECEF 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E9ECEF 75%),linear-gradient(-45deg,transparent 75%,#E9ECEF 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
};

/** Draggable before/after: a vague sketch sent to a shop vs the exact studio mockup in inches. */
export function MockupCompare({ copy }: { copy: CompareCopy }) {
  const { containerRef, position, containerProps, onKeyDown } = useBeforeAfterSlider(52);

  return (
    <div
      ref={containerRef}
      {...containerProps}
      className="relative aspect-square w-full max-w-lg mx-auto select-none overflow-hidden rounded-lg ring-1 ring-black/10 cursor-ew-resize"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Before: what you sent */}
      <div className="absolute inset-0 bg-[#EAE6DF]">
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative w-[74%] opacity-90 [filter:saturate(0.6)_blur(0.4px)]">
            <ShirtSvg color="#FBFAF7" />
            <div className="absolute left-[38%] top-[38%] w-[24%] -translate-x-1/2 -translate-y-1/2 -rotate-6">
              <CrewBadgeArt variant="sketch" />
            </div>
          </div>
        </div>
        <p className="absolute bottom-[9%] left-[6%] max-w-[44%] -rotate-3 bg-[#FFE98A] px-3 py-2 text-xs leading-snug text-[#3B3F45] shadow-md">
          {copy.beforeNote}
        </p>
        <span className="absolute left-3 top-3 rounded-[4px] bg-[#121212]/75 px-2 py-1 text-[11px] font-semibold text-white">
          {copy.before}
        </span>
      </div>

      {/* After: the studio mockup */}
      <div className="absolute inset-0" style={{ ...CHECKER, clipPath: `inset(0 0 0 ${position}%)` }}>
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative w-[74%]">
            <ShirtSvg />
            <span className="absolute left-1/2 top-[8%] bottom-[6%] border-l border-dashed border-primary/40" aria-hidden="true" />
            <div className="absolute left-1/2 top-[44%] w-[34%] -translate-x-1/2 -translate-y-1/2">
              <div className="relative outline-1 outline-dashed outline-primary p-0.5">
                <CrewBadgeArt />
              </div>
              <span className="absolute -top-5 inset-x-0 flex items-center gap-1 text-[10px] font-bold text-primary">
                <span className="h-px flex-1 bg-primary" />6 in<span className="h-px flex-1 bg-primary" />
              </span>
              <span className="absolute -right-7 inset-y-0 flex flex-col items-center gap-1 text-[10px] font-bold text-primary">
                <span className="w-px flex-1 bg-primary" />6 in<span className="w-px flex-1 bg-primary" />
              </span>
            </div>
          </div>
        </div>
        <span className="absolute right-3 top-3 rounded-[4px] bg-primary px-2 py-1 text-[11px] font-semibold text-white">
          {copy.after}
        </span>
        <span className="absolute bottom-3 right-3 rounded-[4px] bg-white px-2 py-1 text-[11px] font-bold text-[#121212] ring-1 ring-black/10">
          A5 · 6 × 6 in
        </span>
      </div>

      {/* Divider */}
      <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" style={{ left: `${position}%` }}>
        <button
          type="button"
          role="slider"
          aria-label={copy.dragHint}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          onKeyDown={onKeyDown}
          className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#121212] shadow-lg ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <ChevronsLeftRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
