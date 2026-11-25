import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ShirtSvgProps {
  color?: string;
  className?: string;
}

/** Flat t-shirt silhouette (viewBox 300×320) used behind the studio and compare demos. */
export function ShirtSvg({ color = '#FFFFFF', className }: ShirtSvgProps) {
  const shadeId = useId();
  return (
    <svg viewBox="0 0 300 320" className={cn('block w-full h-auto', className)} aria-hidden="true">
      <defs>
        <linearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path
        d="M104 18 L58 34 L8 82 L40 128 L72 108 L72 306 L228 306 L228 108 L260 128 L292 82 L242 34 L196 18 Q150 52 104 18 Z"
        fill={color}
        stroke="#D5DADF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M104 18 L58 34 L8 82 L40 128 L72 108 L72 306 L228 306 L228 108 L260 128 L292 82 L242 34 L196 18 Q150 52 104 18 Z"
        fill={`url(#${shadeId})`}
      />
      <path d="M104 18 Q150 60 196 18" fill="none" stroke="#C9CFD5" strokeWidth="3" />
      <path d="M72 108 L72 150 M228 108 L228 150" stroke="#E2E6EA" strokeWidth="1.5" />
    </svg>
  );
}
