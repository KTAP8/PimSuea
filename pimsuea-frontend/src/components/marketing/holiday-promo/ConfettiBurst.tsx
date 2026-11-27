import { motion } from 'framer-motion';

const COLORS = ['#F05A25', '#F8F9FA', '#FFC93C', '#7FD1C7'];
const COUNT = 18;

/** Deterministic spread so render stays pure. */
const PIECES = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + (i % 3) * 0.35;
  const dist = 90 + ((i * 37) % 70);
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist * 0.7 - 20,
    rotate: (i * 67) % 360,
    color: COLORS[i % COLORS.length],
    round: i % 3 === 0,
    delay: (i % 5) * 0.02,
  };
});

/** One-shot burst of brand-coloured confetti from the centre of its parent. */
export function ConfettiBurst({ delay = 0.35 }: { delay?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {PIECES.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute block ${p.round ? 'size-2 rounded-full' : 'h-3 w-1.5 rounded-[1px]'}`}
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
          animate={{
            x: p.x,
            y: [0, p.y, p.y + 60],
            opacity: [0, 1, 0],
            scale: 1,
            rotate: p.rotate + 180,
          }}
          transition={{ duration: 1.4, delay: delay + p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}
