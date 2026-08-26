import { Link } from 'react-router-dom';
import { translations, type Language } from '@/translations/landing';
import { lineAddFriendUrl, lineDisplayId } from '@/lib/line';
import { cn } from '@/lib/utils';

interface MarketingFooterProps {
  variant: 'marketing';
  lang: Language;
  onTermsClick: () => void;
  className?: string;
}

interface AppFooterProps {
  variant: 'app';
  onTermsClick: () => void;
  className?: string;
}

type SiteFooterProps = MarketingFooterProps | AppFooterProps;

function FooterRouterLink({ to, children }: { to: string; children: React.ReactNode }) {
  const className =
    'text-sm font-light text-muted-foreground hover:text-primary transition-colors';
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

function FooterLink({
  href,
  onClick,
  children,
  external,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    'text-sm font-light text-muted-foreground hover:text-primary transition-colors';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} text-left`}>
        {children}
      </button>
    );
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function MarketingFooter({ lang, onTermsClick, className }: Omit<MarketingFooterProps, 'variant'>) {
  const t = translations[lang];
  const lineUrl = lineAddFriendUrl();

  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link to="/">
              <img src="/logo.svg" alt="PimSuea" className="h-8" />
            </Link>
            <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-xs">
              {t.heroSubtitle}
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
              {t.footerMadeIn}
            </p>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <p className="font-bold text-sm text-foreground">{t.footerExplore}</p>
            <nav className="flex flex-col gap-2.5">
              <FooterRouterLink to="/#how">{t.footerLinkHow}</FooterRouterLink>
              <FooterRouterLink to="/#catalog">{t.footerLinkCatalog}</FooterRouterLink>
              <FooterRouterLink to="/#gift">{t.footerLinkTiers}</FooterRouterLink>
              <FooterRouterLink to="/print-on-demand">{t.footerLinkPrintOnDemand}</FooterRouterLink>
              <FooterRouterLink to="/pricing">{t.footerLinkPricing}</FooterRouterLink>
              <FooterRouterLink to="/vs-printful">{t.footerLinkVsPrintful}</FooterRouterLink>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <p className="font-bold text-sm text-foreground">{t.footerSupport}</p>
            <nav className="flex flex-col gap-2.5">
              <FooterLink href={lineUrl} external>
                {t.footerLinkLine} ({lineDisplayId()})
              </FooterLink>
              <FooterRouterLink to="/#faq">{t.footerLinkFaq}</FooterRouterLink>
              <FooterLink onClick={onTermsClick}>{t.footerTerms}</FooterLink>
            </nav>
          </div>
        </div>
      </div>

      {/* Legal row */}
      <div className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-light text-muted-foreground">
          <span>© {new Date().getFullYear()} {t.footerCopyright}</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onTermsClick}
              className="hover:text-primary transition-colors underline underline-offset-2"
            >
              {t.footerTerms}
            </button>
            <span className="hidden sm:inline text-border">·</span>
            <span className="hidden sm:inline">{t.footerMadeIn}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppFooter({ onTermsClick, className }: Omit<AppFooterProps, 'variant'>) {
  const lineUrl = lineAddFriendUrl();

  return (
    <footer className={cn('border-t border-border bg-background mt-auto', className)}>
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-xs font-light text-muted-foreground">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="PimSuea" className="h-5 opacity-80" />
          <span>© {new Date().getFullYear()} PimSuea</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onTermsClick}
            className="hover:text-primary transition-colors underline underline-offset-2"
          >
            ข้อตกลงและเงื่อนไข
          </button>
          <span className="text-border">·</span>
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            LINE ({lineDisplayId()})
          </a>
        </div>
      </div>
    </footer>
  );
}

export function SiteFooter(props: SiteFooterProps) {
  if (props.variant === 'app') {
    return <AppFooter onTermsClick={props.onTermsClick} className={props.className} />;
  }
  return (
    <MarketingFooter lang={props.lang} onTermsClick={props.onTermsClick} className={props.className} />
  );
}
