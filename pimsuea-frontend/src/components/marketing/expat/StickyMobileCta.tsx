import { ArrowRight } from 'lucide-react';
import { EXAMPLE_STARTING_TOTAL_THB } from '@/content/geoFacts';
import { useShowAfterHero } from '@/hooks/useShowAfterHero';
import { appUrl } from '@/lib/site';
import { cn } from '@/lib/utils';

interface StickyMobileCtaProps {
  heroId: string;
  hideWhenVisibleId?: string;
  line: string;
  cta: string;
  fromLabel: string;
}

/** Mobile-only bottom bar that slides up once the hero is scrolled past. */
export function StickyMobileCta({ heroId, hideWhenVisibleId, line, cta, fromLabel }: StickyMobileCtaProps) {
  const show = useShowAfterHero(heroId, hideWhenVisibleId);

  return (
    <div
      aria-hidden={!show}
      className={cn(
        'md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 motion-reduce:transition-none',
        show ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="flex items-center gap-3">
        <p className="flex-1 leading-tight">
          <span className="block text-xs text-[#6C757D]">{fromLabel}</span>
          <span className="block text-sm font-bold text-[#121212]">
            ฿{EXAMPLE_STARTING_TOTAL_THB} · {line}
          </span>
        </p>
        <a
          href={appUrl('/catalog')}
          tabIndex={show ? 0 : -1}
          className="inline-flex h-12 items-center gap-2 rounded-[4px] bg-action px-5 text-sm font-bold text-action-foreground"
        >
          {cta}
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}
