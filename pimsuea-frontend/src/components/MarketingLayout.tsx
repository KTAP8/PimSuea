import { type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from '@/pages/Landing';
import NewLanding from '@/pages/NewLanding';
import PrintOnDemandPage from '@/pages/marketing/PrintOnDemandPage';
import PricingPage from '@/pages/marketing/PricingPage';
import VsPrintfulPage from '@/pages/marketing/VsPrintfulPage';
import CustomShirtNoMinimumPage from '@/pages/marketing/CustomShirtNoMinimumPage';
import ClubAndGiftShirtsPage from '@/pages/marketing/ClubAndGiftShirtsPage';
import CustomShirtsThailandPage from '@/pages/marketing/CustomShirtsThailandPage';
import { MarketingPageTracker } from '@/components/MarketingPageTracker';
import { RedirectToApp } from '@/components/RedirectToApp';
import { localizedPath, THAI_PREFIX, type MarketingPath } from '@/content/marketingRoutes';
import { RouteLanguageProvider } from '@/i18n/LanguageContext';
import type { Language } from '@/i18n/types';
import { LAUNCH_DATE } from '@/lib/launch';

/** Public marketing site (pimsuea.com): English at /, Thai mirror under /th. */
const MARKETING_PAGES: Record<Exclude<MarketingPath, '/'>, ComponentType> = {
  '/custom-shirts-thailand': CustomShirtsThailandPage,
  '/print-on-demand': PrintOnDemandPage,
  '/pricing': PricingPage,
  '/vs-printful': VsPrintfulPage,
  '/custom-shirt-no-minimum': CustomShirtNoMinimumPage,
  '/club-and-gift-shirts': ClubAndGiftShirtsPage,
};

function marketingRoutes(lang: Language) {
  return Object.entries(MARKETING_PAGES).map(([path, Page]) => (
    <Route
      key={`${lang}${path}`}
      path={localizedPath(path, lang)}
      element={
        <RouteLanguageProvider lang={lang}>
          <Page />
        </RouteLanguageProvider>
      }
    />
  ));
}

export function MarketingLayout() {
  const preLaunch = !import.meta.env.DEV && new Date() < LAUNCH_DATE;

  return (
    <>
      <MarketingPageTracker />
      <Routes>
      <Route
        path="/"
        element={
          preLaunch ? (
            <Landing />
          ) : (
            <RouteLanguageProvider lang="en">
              <NewLanding />
            </RouteLanguageProvider>
          )
        }
      />
      <Route path="/home" element={<Navigate to="/" replace />} />
      {!preLaunch && (
        <>
          <Route
            path={THAI_PREFIX}
            element={
              <RouteLanguageProvider lang="th">
                <NewLanding />
              </RouteLanguageProvider>
            }
          />
          {marketingRoutes('en')}
          {marketingRoutes('th')}
          <Route path={`${THAI_PREFIX}/*`} element={<Navigate to={THAI_PREFIX} replace />} />
        </>
      )}
      {preLaunch ? (
        <Route path="*" element={<Navigate to="/" replace />} />
      ) : (
        <Route path="*" element={<RedirectToApp />} />
      )}
    </Routes>
    </>
  );
}
