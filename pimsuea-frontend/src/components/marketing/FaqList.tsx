interface FaqListProps {
  title: string;
  items: { q: string; a: string }[];
}

/** Simple, crawlable Q&A list for marketing answer pages. */
export function FaqList({ title, items }: FaqListProps) {
  return (
    <section className="space-y-4 max-w-3xl">
      <h2 className="font-black text-2xl">{title}</h2>
      <dl className="space-y-4">
        {items.map((item) => (
          <div key={item.q} className="rounded-xl border border-border p-5 bg-card/70">
            <dt className="font-bold text-sm mb-1.5">{item.q}</dt>
            <dd className="text-sm text-muted-foreground font-light leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
