import { Plus } from 'lucide-react';

interface FaqAccordionProps {
  title: string;
  items: { q: string; a: string }[];
}

/** Native <details> accordion: answers stay in the DOM, so they're crawlable and work without JS. */
export function FaqAccordion({ title, items }: FaqAccordionProps) {
  return (
    <section className="bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16 md:py-24">
        <h2 className="font-heavy text-4xl sm:text-5xl leading-[0.98] tracking-tight text-[#121212]">{title}</h2>
        <div className="mt-8 divide-y divide-[#E9ECEF] border-y border-[#E9ECEF]">
          {items.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-semibold text-[#121212] [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus className="size-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="pb-5 pr-8 text-[15px] leading-relaxed text-[#121212]/65">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
