import { Quote } from 'lucide-react';
import { TESTIMONIALS } from '@/content/testimonials';

/** Real customer quotes only (see content/testimonials.ts). Renders nothing when there are none. */
export function TestimonialsSection({ lang, title }: { lang: 'en' | 'th'; title: string }) {
  if (!TESTIMONIALS.length) return null;
  return (
    <section className="py-20 border-t border-border" aria-labelledby="testimonials-title">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 id="testimonials-title" className="text-3xl font-bold tracking-tight mb-10">{title}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((tm) => (
            <figure key={tm.name} className="rounded-2xl border bg-card p-6 flex flex-col gap-4">
              <Quote className="h-5 w-5 text-primary" aria-hidden="true" />
              <blockquote className="text-base leading-relaxed">{tm.quote[lang]}</blockquote>
              <figcaption className="mt-auto text-sm">
                <span className="font-semibold">{tm.name}</span>
                <span className="text-muted-foreground"> · {tm.role[lang]}</span>
                {tm.order && <span className="block text-xs text-muted-foreground mt-1">{tm.order[lang]}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
