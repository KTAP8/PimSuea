import type { ReactNode } from 'react';
import { useRevealOnView } from '@/hooks/useRevealOnView';
import { cn } from '@/lib/utils';
import { ChatBubble, type ChatMessage } from './ChatBubble';

interface ChatPanelProps {
  header: string;
  status: string;
  messages: readonly ChatMessage[];
  tone: 'muted' | 'brand';
  footer?: ReactNode;
  className?: string;
}

/** Phone-style chat window whose messages appear one by one when scrolled into view. */
export function ChatPanel({ header, status, messages, tone, footer, className }: ChatPanelProps) {
  const { ref, visible } = useRevealOnView<HTMLDivElement>(0.35);
  const brand = tone === 'brand';

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col overflow-hidden rounded-[20px] border bg-[#F8F9FA] shadow-[0_18px_40px_-24px_rgba(18,18,18,0.35)]',
        brand ? 'border-primary/30' : 'border-[#E9ECEF]',
        className,
      )}
    >
      <div className={cn('flex items-center gap-3 px-4 py-3', brand ? 'bg-primary text-white' : 'bg-white border-b border-[#E9ECEF]')}>
        <span
          className={cn(
            'grid size-9 place-items-center rounded-full text-xs font-bold',
            brand ? 'bg-white/15' : 'bg-[#E9ECEF] text-[#6C757D]',
          )}
          aria-hidden="true"
        >
          {header.slice(0, 2).toUpperCase()}
        </span>
        <span>
          <span className="block text-sm font-semibold">{header}</span>
          <span className={cn('block text-[11px]', brand ? 'text-white/70' : 'text-[#6C757D]')}>{status}</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 min-h-[360px]">
        {messages.map((m, i) => (
          <ChatBubble key={`${m.from}-${i}`} message={m} visible={visible} delay={i * 450} />
        ))}
      </div>

      {footer && <div className="border-t border-[#E9ECEF] bg-white px-4 py-3">{footer}</div>}
    </div>
  );
}
