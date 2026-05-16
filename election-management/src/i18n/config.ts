import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_STORAGE_KEY,
  type AppLocale,
} from '@/types/locale'

import enCommon from '@/locales/en/common.json'
import enNav from '@/locales/en/nav.json'
import enAuth from '@/locales/en/auth.json'
import enDashboard from '@/locales/en/dashboard.json'
import enWaitlist from '@/locales/en/waitlist.json'
import enSettings from '@/locales/en/settings.json'
import enAdmin from '@/locales/en/admin.json'

import urCommon from '@/locales/ur/common.json'
import urNav from '@/locales/ur/nav.json'
import urAuth from '@/locales/ur/auth.json'
import urDashboard from '@/locales/ur/dashboard.json'
import urWaitlist from '@/locales/ur/waitlist.json'
import urSettings from '@/locales/ur/settings.json'
import urAdmin from '@/locales/ur/admin.json'

import arCommon from '@/locales/ar/common.json'
import arNav from '@/locales/ar/nav.json'
import arAuth from '@/locales/ar/auth.json'
import arDashboard from '@/locales/ar/dashboard.json'
import arWaitlist from '@/locales/ar/waitlist.json'
import arSettings from '@/locales/ar/settings.json'
import arAdmin from '@/locales/ar/admin.json'

import hiCommon from '@/locales/hi/common.json'
import hiNav from '@/locales/hi/nav.json'
import hiAuth from '@/locales/hi/auth.json'
import hiDashboard from '@/locales/hi/dashboard.json'
import hiWaitlist from '@/locales/hi/waitlist.json'
import hiSettings from '@/locales/hi/settings.json'
import hiAdmin from '@/locales/hi/admin.json'

export const I18N_NAMESPACES = [
  'common',
  'nav',
  'auth',
  'dashboard',
  'waitlist',
  'settings',
  'admin',
] as const

function readStoredLocale(): AppLocale {
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isAppLocale(v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    dashboard: enDashboard,
    waitlist: enWaitlist,
    settings: enSettings,
    admin: enAdmin,
  },
  ur: {
    common: urCommon,
    nav: urNav,
    auth: urAuth,
    dashboard: urDashboard,
    waitlist: urWaitlist,
    settings: urSettings,
    admin: urAdmin,
  },
  ar: {
    common: arCommon,
    nav: arNav,
    auth: arAuth,
    dashboard: arDashboard,
    waitlist: arWaitlist,
    settings: arSettings,
    admin: arAdmin,
  },
  hi: {
    common: hiCommon,
    nav: hiNav,
    auth: hiAuth,
    dashboard: hiDashboard,
    waitlist: hiWaitlist,
    settings: hiSettings,
    admin: hiAdmin,
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'common',
  ns: [...I18N_NAMESPACES],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18n

export function applyDocumentLocale(locale: AppLocale, rtl: boolean) {
  const root = document.documentElement
  root.lang = locale
  root.dir = rtl ? 'rtl' : 'ltr'
  root.classList.toggle('rtl', rtl)
}
