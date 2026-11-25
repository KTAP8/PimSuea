import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useRevealOnView } from '@/hooks/useRevealOnView';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms. */
  delay?: number;
}

/** Fade + 12px rise when scrolled into view. Visible in prerendered HTML and under reduced motion. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const { ref, visible } = useRevealOnView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
