import { Link } from 'react-router-dom';
import { ArrowRight, Globe } from 'lucide-react';
import { PageSEO } from '@/components/PageSEO';
import { SiteFooter } from '@/components/SiteFooter';
import { TermsModal } from '@/components/TermsModal';
import { Button } from '@/components/ui/button';
import { appUrl } from '@/lib/site';
import { JsonLdScript } from '@/lib/geoSchema';
import { useState } from 'react';

interface MarketingAnswerLayoutProps {
  title: string;
  description: string;
  canonical: string;
  jsonLd: Record<string, unknown> | Record<string, unknown>[];
  ctaLabelTh: string;
  ctaLabelEn: string;
  children: React.ReactNode;
}

export function MarketingAnswerLayout({
  title,
  description,
  canonical,
  jsonLd,
  ctaLabelTh,
  ctaLabelEn,
  children,
}: MarketingAnswerLayoutProps) {
  const [termsOpen, setTermsOpen] = useState(false);
  const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <>
      <PageSEO title={title} description={description} canonical={canonical} />
      {schemas.map((schema, i) => (
        <JsonLdScript key={i} data={schema} />
      ))}

      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/">
              <img src="/logo.svg" alt="PimSuea" className="h-8" />
            </Link>
            <a href={appUrl('/catalog')}>
              <Button
                size="sm"
                className="bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-xs"
              >
                {ctaLabelTh} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </a>
          </div>
        </header>

        <main className="flex-1">
          <article className="max-w-3xl mx-auto px-6 py-12 md:py-16 prose prose-neutral dark:prose-invert max-w-none">
            {children}
          </article>

          <section className="border-t border-border bg-secondary/30">
            <div className="max-w-3xl mx-auto px-6 py-10 text-center space-y-4">
              <p className="text-lg font-bold">พร้อมออกแบบแล้ว?</p>
              <p className="text-sm text-muted-foreground font-light" lang="en">
                Ready to design? Open the studio — live pricing, no minimum.
              </p>
              <a href={appUrl('/catalog')}>
                <Button className="bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider">
                  {ctaLabelEn} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </section>
        </main>

        <SiteFooter variant="marketing" lang="th" onTermsClick={() => setTermsOpen(true)} />
        <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      </div>
    </>
  );
}

/** Bilingual section wrapper — both languages always in DOM for crawlers. */
export function BilingualSections({
  th,
  en,
}: {
  th: React.ReactNode;
  en: React.ReactNode;
}) {
  return (
    <>
      <section lang="th" className="not-prose space-y-6 mb-12">
        {th}
      </section>
      <section lang="en" className="not-prose space-y-6 border-t border-border pt-12">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Globe className="w-4 h-4" /> English
        </p>
        {en}
      </section>
    </>
  );
}

export function AnswerH1({ th, en }: { th: string; en: string }) {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{th}</h1>
      <p className="text-lg text-muted-foreground font-light mb-8" lang="en">
        {en}
      </p>
    </>
  );
}

export function FactList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-3 not-prose">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col sm:flex-row sm:gap-4 border-b border-border/60 pb-3">
          <dt className="font-bold text-sm shrink-0 sm:w-40">{item.label}</dt>
          <dd className="text-muted-foreground font-light">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
