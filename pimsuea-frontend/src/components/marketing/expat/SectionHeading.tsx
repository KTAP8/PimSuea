import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  label?: string;
  title: string;
  body?: string;
  tone?: 'light' | 'dark';
  className?: string;
}

/** Kicker + compressed headline + optional body, used by every section on the expat page. */
export function SectionHeading({ label, title, body, tone = 'light', className }: SectionHeadingProps) {
  const dark = tone === 'dark';
  return (
    <div className={cn('max-w-2xl', className)}>
      {label && (
        <p className={cn('text-xs font-bold uppercase tracking-[0.18em] mb-3', dark ? 'text-[#2FA4AF]' : 'text-primary')}>
          {label}
        </p>
      )}
      <h2 className={cn('font-heavy text-4xl sm:text-5xl leading-[0.98] [&:lang(th)]:leading-[1.2] tracking-tight', dark ? 'text-white' : 'text-[#121212]')}>
        {title}
      </h2>
      {body && (
        <p className={cn('mt-4 text-base sm:text-lg leading-relaxed', dark ? 'text-white/65' : 'text-[#121212]/65')}>{body}</p>
      )}
    </div>
  );
}
