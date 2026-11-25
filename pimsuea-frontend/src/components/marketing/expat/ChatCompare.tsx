import { useState } from 'react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { EXPAT_PAIN_POINTS_COPY } from '@/content/expatPainPointsCopy';
import { GEO_URLS } from '@/content/geoFacts';
import type { Language } from '@/i18n/types';
import { cn } from '@/lib/utils';
import { ChatPanel } from './ChatPanel';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

/** Pain point 2 (language): the usual LINE-quote thread vs the self-serve studio flow. Tabs on mobile. */
export function ChatCompare({ lang }: { lang: Language }) {
  const copy = EXPAT_PAIN_POINTS_COPY[lang].chat;
  const [tab, setTab] = useState<'shop' | 'us'>('shop');

  const lineLink = (
    <a
      href={GEO_URLS.line}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
    >
      <MessageCircle className="size-4" strokeWidth={2} />
      {copy.lineCta}
      <ArrowUpRight className="size-3.5" />
    </a>
  );

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 grid gap-10 md:grid-cols-[0.9fr_1.4fr] md:gap-14 md:items-center">
        <Reveal>
          <SectionHeading label={copy.label} title={copy.title} body={copy.body} />
        </Reveal>

        <div>
          <div role="tablist" className="md:hidden mb-4 grid grid-cols-2 rounded-md bg-[#E9ECEF] p-1">
            {(['shop', 'us'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  'h-11 rounded-[4px] text-sm font-semibold transition-colors',
                  tab === key ? 'bg-white text-[#121212] shadow-sm' : 'text-[#6C757D]',
                )}
              >
                {key === 'shop' ? copy.tabShop : copy.tabUs}
              </button>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ChatPanel
              header={copy.shopHeader}
              status={copy.shopStatus}
              messages={copy.shopThread}
              tone="muted"
              className={cn(tab !== 'shop' && 'hidden md:flex', 'md:opacity-90')}
            />
            <ChatPanel
              header={copy.usHeader}
              status={copy.usStatus}
              messages={copy.usThread}
              tone="brand"
              footer={lineLink}
              className={cn(tab !== 'us' && 'hidden md:flex')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
