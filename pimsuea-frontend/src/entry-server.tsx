/* eslint-disable react-refresh/only-export-components -- build-time SSR entry, never hot-reloaded */
/**
 * Build-time prerender entry (not shipped to browsers).
 * Renders marketing routes to static HTML so search and AI crawlers that don't run JS see real content.
 * Used by scripts/prerender.mjs after `vite build --ssr`.
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { MarketingLayout } from '@/components/MarketingLayout';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { allMarketingUrlPaths } from '@/content/marketingRoutes';

/** Mirrors <AnalyticsProvider/>, <MetaPageTracker/>, and <Analytics/> in App.tsx (all render null) so useId values match on hydrate. */
function Placeholder() {
  return null;
}

export const routes = allMarketingUrlPaths();

export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <LanguageProvider>
        <StaticRouter location={url}>
          <Placeholder />
          <Placeholder />
          <MarketingLayout />
          <Placeholder />
        </StaticRouter>
      </LanguageProvider>
    </StrictMode>,
  );
}
