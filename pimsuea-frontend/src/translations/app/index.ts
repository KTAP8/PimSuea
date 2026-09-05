import type { Language } from '@/i18n/types';
import { commonTranslations } from './common';
import { navTranslations } from './nav';
import { authTranslations } from './auth';
import { settingsTranslations } from './settings';
import { onboardingTranslations } from './onboarding';
import { dashboardTranslations } from './dashboard';
import { catalogTranslations } from './catalog';
import { ordersTranslations } from './orders';
import { checkoutTranslations } from './checkout';
import { studioTranslations } from './studio';
import { translations as landingTranslations } from '../landing';

export type AppTranslations = {
  common: (typeof commonTranslations)['th'];
  nav: (typeof navTranslations)['th'];
  auth: (typeof authTranslations)['th'];
  settings: (typeof settingsTranslations)['th'];
  onboarding: (typeof onboardingTranslations)['th'];
  dashboard: (typeof dashboardTranslations)['th'];
  catalog: (typeof catalogTranslations)['th'];
  orders: (typeof ordersTranslations)['th'];
  checkout: (typeof checkoutTranslations)['th'];
  studio: (typeof studioTranslations)['th'];
  landing: (typeof landingTranslations)['th'];
};

function buildAppTranslations(lang: Language): AppTranslations {
  return {
    common: commonTranslations[lang],
    nav: navTranslations[lang],
    auth: authTranslations[lang],
    settings: settingsTranslations[lang],
    onboarding: onboardingTranslations[lang],
    dashboard: dashboardTranslations[lang],
    catalog: catalogTranslations[lang],
    orders: ordersTranslations[lang],
    checkout: checkoutTranslations[lang],
    studio: studioTranslations[lang],
    landing: landingTranslations[lang],
  };
}

export const appTranslations: Record<Language, AppTranslations> = {
  th: buildAppTranslations('th'),
  en: buildAppTranslations('en'),
};
