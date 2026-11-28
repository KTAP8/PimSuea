import type { Language } from '@/i18n/types';
import { commonTranslations } from './common';
import { navTranslations } from './nav';
import { authTranslations } from './auth';
import { accountTranslations } from './account';
import { settingsTranslations } from './settings';
import { onboardingTranslations } from './onboarding';
import { dashboardTranslations } from './dashboard';
import { catalogTranslations } from './catalog';
import { ordersTranslations } from './orders';
import { checkoutTranslations } from './checkout';
import { studioTranslations } from './studio';
import { studioToolsTranslations } from './studioTools';
import { orderingTranslations } from './ordering';
import { translations as landingTranslations } from '../landing';

export type AppTranslations = {
  common: (typeof commonTranslations)['th'];
  nav: (typeof navTranslations)['th'];
  auth: (typeof authTranslations)['th'];
  account: (typeof accountTranslations)['en'];
  settings: (typeof settingsTranslations)['th'];
  onboarding: (typeof onboardingTranslations)['th'];
  dashboard: (typeof dashboardTranslations)['th'];
  catalog: (typeof catalogTranslations)['th'];
  orders: (typeof ordersTranslations)['th'];
  checkout: (typeof checkoutTranslations)['th'];
  studio: (typeof studioTranslations)['th'];
  studioTools: (typeof studioToolsTranslations)['en'];
  ordering: (typeof orderingTranslations)['en'];
  landing: (typeof landingTranslations)['th'];
};

function buildAppTranslations(lang: Language): AppTranslations {
  return {
    common: commonTranslations[lang],
    nav: navTranslations[lang],
    auth: authTranslations[lang],
    account: accountTranslations[lang],
    settings: settingsTranslations[lang],
    onboarding: onboardingTranslations[lang],
    dashboard: dashboardTranslations[lang],
    catalog: catalogTranslations[lang],
    orders: ordersTranslations[lang],
    checkout: checkoutTranslations[lang],
    studio: studioTranslations[lang],
    studioTools: studioToolsTranslations[lang],
    ordering: orderingTranslations[lang],
    landing: landingTranslations[lang],
  };
}

export const appTranslations: Record<Language, AppTranslations> = {
  th: buildAppTranslations('th'),
  en: buildAppTranslations('en'),
};
