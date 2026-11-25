import { useId } from 'react';
import { cn } from '@/lib/utils';

interface CrewBadgeArtProps {
  /** `sketch` = wobbly hand-drawn version (what people send a shop); `clean` = the studio artwork. */
  variant?: 'clean' | 'sketch';
  className?: string;
}

/** Sample club logo used in the page demos. Fictional, drawn in SVG (no real brand). */
export function CrewBadgeArt({ variant = 'clean', className }: CrewBadgeArtProps) {
  const roughId = useId();
  const sketch = variant === 'sketch';
  const ink = sketch ? '#3B3F45' : '#08636D';

  return (
    <svg viewBox="0 0 120 120" className={cn('block w-full h-auto', className)} aria-hidden="true">
      {sketch && (
        <defs>
          <filter id={roughId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
        </defs>
      )}
      <g filter={sketch ? `url(#${roughId})` : undefined}>
        <circle cx="60" cy="60" r="54" fill={sketch ? 'none' : ink} stroke={ink} strokeWidth={sketch ? 2.5 : 0} />
        <circle cx="60" cy="60" r="44" fill="none" stroke={sketch ? ink : '#F8F9FA'} strokeWidth="1.5" strokeDasharray={sketch ? '0' : '3 3'} />
        <path
          d="M30 72 Q45 52 60 66 T90 58"
          fill="none"
          stroke={sketch ? ink : '#F8F9FA'}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M44 48 L60 34 L76 48" fill="none" stroke={sketch ? ink : '#F8F9FA'} strokeWidth="4" strokeLinejoin="round" />
        <text
          x="60"
          y="92"
          textAnchor="middle"
          fontSize="11"
          fontWeight="900"
          letterSpacing="1.5"
          fill={sketch ? ink : '#F8F9FA'}
          style={{ fontFamily: sketch ? 'cursive' : 'vision, sans-serif' }}
        >
          BKK RUN CLUB
        </text>
      </g>
    </svg>
  );
}
