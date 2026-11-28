import { TRUST_STATS } from '@/content/geoFacts';

type Props = {
  labels: { shirts: string; provinces: string };
  className?: string;
};

/**
 * Liquid-glass proof pill: two verified numbers (number on top, label below, thin divider).
 * Translucent + heavy blur/saturation + top-edge highlight and a soft sheen; meant to float over
 * the hero visual so the glass has something to refract.
 * Static values — prerendered HTML shows the real numbers. Source of truth: TRUST_STATS in geoFacts.
 */
export function HeroTrustStats({ labels, className = '' }: Props) {
  const stats = [
    { value: `${TRUST_STATS.shirtsPrinted}+`, label: labels.shirts },
    { value: String(TRUST_STATS.provinces), label: labels.provinces },
  ];
  return (
    <dl
      className={`relative isolate inline-flex items-stretch overflow-hidden rounded-full px-3 py-3
        border border-white/70 bg-white/30 backdrop-blur-2xl backdrop-saturate-[1.8]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(255,255,255,0.35),0_12px_32px_rgba(18,18,18,0.12)]
        ${className}`}
    >
      {/* sheen: bright top half fading out, like light on curved glass */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 -z-10 bg-gradient-to-b from-white/70 to-white/0" />
      {/* faint coloured edge glow picked up from the background */}
      <span aria-hidden="true" className="pointer-events-none absolute -inset-px -z-20 rounded-full bg-gradient-to-r from-primary/10 via-white/0 to-action/10" />
      {stats.map((s, i) => (
        <div key={s.label} className={`flex flex-col items-center justify-center text-center px-6 ${i > 0 ? 'border-l border-white/60' : ''}`}>
          <dt className="order-2 mt-1 text-sm text-foreground/60 whitespace-nowrap">{s.label}</dt>
          <dd className="order-1 font-black text-xl md:text-2xl tracking-tight tabular-nums text-foreground leading-none">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
