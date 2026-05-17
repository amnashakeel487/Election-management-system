export const SUPPORTED_LOCALES = ['en', 'ur', 'ar', 'hi'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

export const RTL_LOCALES: readonly AppLocale[] = ['ur', 'ar']

export const LOCALE_STORAGE_KEY = 'fv-locale'

export interface LocaleOption {
  code: AppLocale
  /** Label shown in the switcher (native script) */
  label: string
  /** English name for accessibility */
  englishName: string
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'en', label: 'English', englishName: 'English' },
  { code: 'ur', label: 'اردو', englishName: 'Urdu' },
  { code: 'ar', label: 'العربية', englishName: 'Arabic' },
  { code: 'hi', label: 'हिन्दी', englishName: 'Hindi' },
]

/** Creator dashboard: English and Urdu only */
export const CREATOR_LOCALES: readonly AppLocale[] = ['en', 'ur']

/** Public site (landing, login, signup): English and Urdu only */
export const PUBLIC_LOCALES: readonly AppLocale[] = CREATOR_LOCALES

/** Admin dashboard: English and Urdu only */
export const ADMIN_LOCALES: readonly AppLocale[] = CREATOR_LOCALES

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function isRtlLocale(locale: AppLocale): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale)
}
