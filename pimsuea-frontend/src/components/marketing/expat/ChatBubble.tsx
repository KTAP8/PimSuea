import { Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  from: 'me' | 'them' | 'meta' | 'typing' | 'step';
  text: string;
  attachment?: boolean;
  translate?: boolean;
  detail?: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
  visible: boolean;
  delay: number;
}

/** One row in a ChatPanel: a sent/received bubble, a status line, a typing indicator or a studio step. */
export function ChatBubble({ message, visible, delay }: ChatBubbleProps) {
  const { from, text } = message;
  const motionClass = cn(
    'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
  );
  const style = { transitionDelay: visible ? `${delay}ms` : '0ms' };

  if (from === 'meta') {
    return (
      <p className={cn('text-center text-[11px] text-[#6C757D]', motionClass)} style={style}>
        {text}
      </p>
    );
  }

  if (from === 'typing') {
    return (
      <div className={cn('flex', motionClass)} style={style} aria-label="typing">
        <span className="flex gap-1 rounded-2xl rounded-bl-sm bg-[#E9ECEF] px-4 py-3">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="size-1.5 rounded-full bg-[#6C757D] animate-bounce motion-reduce:animate-none"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </span>
      </div>
    );
  }

  if (from === 'step') {
    return (
      <div className={cn('flex items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-black/5', motionClass)} style={style}>
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <span>
          <span className="block text-sm font-semibold text-[#121212]">{text}</span>
          {message.detail && <span className="block text-xs text-[#6C757D]">{message.detail}</span>}
        </span>
      </div>
    );
  }

  const mine = from === 'me';
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start', motionClass)} style={style}>
      <div className="max-w-[82%]">
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-snug',
            mine ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm bg-[#E9ECEF] text-[#121212]',
          )}
        >
          {message.attachment && (
            <span className="mb-2 flex h-16 w-24 items-center justify-center rounded-md bg-white/15">
              <ImageIcon className="size-5 opacity-70" strokeWidth={1.5} />
            </span>
          )}
          {text}
        </div>
        {message.translate && <p className="mt-1 text-[11px] text-[#6C757D] underline decoration-dotted">See translation?</p>}
      </div>
    </div>
  );
}
