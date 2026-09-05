import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { PageSEO } from '@/components/PageSEO';
import { SiteFooter } from '@/components/SiteFooter';
import { TermsModal } from '@/components/TermsModal';
import { Button } from '@/components/ui/button';
import { appUrl } from '@/lib/site';
import { JsonLdScript } from '@/lib/geoSchema';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useMarketingLang } from '@/i18n/LanguageContext';

export { useMarketingLang };

interface MarketingAnswerLayoutProps {
  title: string;
  description: string;
  canonical: string;
  jsonLd: Record<string, unknown> | Record<string, unknown>[];
  ctaLabelTh?: string;
  ctaLabelEn?: string;
  activeNav?: 'print-on-demand' | 'pricing' | 'vs-printful';
  children: React.ReactNode;
}

export function MarketingAnswerLayout({
  title,
  description,
  canonical,
  jsonLd,
  ctaLabelTh = 'เริ่มออกแบบ',
  ctaLabelEn = 'Start designing',
  activeNav,
  children,
}: MarketingAnswerLayoutProps) {
  const { lang } = useMarketingLang();
  const [termsOpen, setTermsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <>
      <PageSEO title={title} description={description} canonical={canonical} />
      {schemas.map((schema, i) => (
        <JsonLdScript key={i} data={schema} />
      ))}

      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
        {/* Top Sticky Header */}
        <header
          className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'bg-background/90 backdrop-blur-md border-b border-border shadow-xs'
              : 'bg-background/80 backdrop-blur-xs border-b border-border/60'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Left: Logo & Nav Links */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group">
                <img src="/logo.svg" alt="PimSuea" className="h-8 transition-transform group-hover:scale-105" />
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
                <Link
                  to="/print-on-demand"
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeNav === 'print-on-demand' || location.pathname === '/print-on-demand'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {lang === 'en' ? 'Print on Demand' : 'Print on Demand'}
                </Link>
                <Link
                  to="/pricing"
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeNav === 'pricing' || location.pathname === '/pricing'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {lang === 'en' ? 'Pricing & Rates' : 'ตารางราคา'}
                </Link>
                <Link
                  to="/vs-printful"
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeNav === 'vs-printful' || location.pathname === '/vs-printful'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {lang === 'en' ? 'vs Printful' : 'เทียบกับ Printful'}
                </Link>
              </nav>
            </div>

            {/* Right: Language switch & Studio CTA */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher compact />

              <a href={appUrl('/catalog')}>
                <Button
                  size="sm"
                  className="bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-xs px-4 shadow-sm hover:shadow-md hover:shadow-action/20 transition-all cursor-pointer"
                >
                  <span>{lang === 'en' ? ctaLabelEn : ctaLabelTh}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}

          {/* Bottom Conversion CTA Section */}
          <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-secondary/30 via-background to-secondary/40 py-16 md:py-24">
            {/* Glow backdrop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

            <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === 'en' ? 'No Minimum Order' : 'สั่ง 1 ตัวก็พิมพ์ได้ ไม่มีขั้นต่ำ'}
              </div>

              <h2 className="font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {lang === 'en' ? 'Ready to bring your ideas to life?' : 'พร้อมเริ่มออกแบบเสื้อของคุณแล้วหรือยัง?'}
              </h2>

              <p className="text-muted-foreground font-light text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                {lang === 'en'
                  ? 'Open the design studio in your browser. Upload your graphic, see instant THB pricing, and pay via PromptPay.'
                  : 'เปิดสตูดิโอออกแบบบนเบราว์เซอร์ ลากวางลายเสื้อ รู้ราคาทันที จ่ายผ่าน PromptPay พร้อมจัดส่งทั่วไทย'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a href={appUrl('/catalog')}>
                  <Button
                    size="lg"
                    className="bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-sm sm:text-base px-8 h-12 shadow-lg shadow-action/25 hover:shadow-xl hover:shadow-action/30 transition-all cursor-pointer"
                  >
                    {lang === 'en' ? 'Open Design Studio' : 'เปิดสตูดิโอออกแบบ'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <Link
                  to="/pricing"
                  className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-secondary/60 transition-colors"
                >
                  {lang === 'en' ? 'View Pricing Tables' : 'ดูตารางราคาทั้งหมด'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {/* Trust highlights under CTA */}
              <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {lang === 'en' ? 'DTG High-Res Print' : 'สกรีนระบบ DTG คมชัด'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {lang === 'en' ? '77 Provinces Delivery' : 'ส่งถึงบ้าน 77 จังหวัด'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {lang === 'en' ? 'PromptPay Supported' : 'ชำระผ่าน PromptPay'}
                </span>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter variant="marketing" lang={lang} onTermsClick={() => setTermsOpen(true)} />
        <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} lang={lang} />
      </div>
    </>
  );
}

/** Bilingual section wrapper — both languages always rendered in DOM for SEO crawlers with semantic lang tags */
export function BilingualSections({
  th,
  en,
}: {
  th: React.ReactNode;
  en: React.ReactNode;
}) {
  const { lang } = useMarketingLang();

  return (
    <>
      {/* Active visible section based on selected language */}
      <div className="space-y-16">
        {lang === 'th' ? (
          <section lang="th" className="space-y-16">
            {th}
          </section>
        ) : (
          <section lang="en" className="space-y-16">
            {en}
          </section>
        )}
      </div>

      {/* Hidden semantic section for crawlers to guarantee 100% indexing of the alternate language */}
      <div className="sr-only" aria-hidden="true">
        {lang === 'th' ? (
          <section lang="en">{en}</section>
        ) : (
          <section lang="th">{th}</section>
        )}
      </div>
    </>
  );
}

export function AnswerH1({ th, en }: { th: string; en: string }) {
  const { lang } = useMarketingLang();
  return (
    <div className="space-y-3">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
        {lang === 'en' ? en : th}
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
        {lang === 'en' ? th : en}
      </p>
    </div>
  );
}

export function FactList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between p-4 rounded-xl border border-border bg-card/80 shadow-xs hover:border-primary/30 transition-all gap-4"
        >
          <dt className="font-bold text-sm text-foreground shrink-0">{item.label}</dt>
          <dd className="text-sm text-muted-foreground font-light text-right">{item.value}</dd>
        </div>
      ))}
    </div>
  );
}
