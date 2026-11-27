import { useId } from 'react';

/** Circular sticker with text running around its edge; spins slowly. */
export function RotatingBadge({ text }: { text: string }) {
  const pathId = useId();
  return (
    <div aria-hidden className="relative size-24 sm:size-28">
      <svg viewBox="0 0 100 100" className="animate-spin-slow size-full">
        <defs>
          <path id={pathId} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <circle cx="50" cy="50" r="49" fill="#F05A25" />
        <text className="fill-[#F8F9FA] text-[9.5px] font-bold tracking-[0.12em]">
          <textPath href={`#${pathId}`}>{text}</textPath>
        </text>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="size-9 fill-none stroke-[#F8F9FA] stroke-[1.6]">
          <path
            strokeLinejoin="round"
            d="M8 3.5 4 5.5 2.5 9.5l3 1.2V20.5h13v-9.8l3-1.2L20 5.5l-4-2c-.6 1.6-2.2 2.6-4 2.6S8.6 5.1 8 3.5Z"
          />
        </svg>
      </span>
    </div>
  );
}
