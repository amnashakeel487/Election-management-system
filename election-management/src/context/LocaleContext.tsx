import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import i18n, { applyDocumentLocale } from '@/i18n/config'
import { saveUserLocalePreference } from '@/services/localeService'
import {
  DEFAULT_LOCALE,
  isAppLocale,
  isRtlLocale,
  LOCALE_STORAGE_KEY,
  type AppLocale,
} from '@/types/locale'

type LocaleContextValue = {
  locale: AppLocale
  isRtl: boolean
  setLocale: (locale: AppLocale) => void
  syncFromProfile: (profileLocale: string | null | undefined) => void
  registerUserId: (userId: string | null) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readStoredLocale(): AppLocale {
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isAppLocale(v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale())
  const [userId, setUserId] = useState<string | null>(null)

  const applyLocale = useCallback((next: AppLocale, persist: boolean) => {
    setLocaleState(next)
    const rtl = isRtlLocale(next)
    applyDocumentLocale(next, rtl)
    void i18n.changeLanguage(next)
    if (persist) {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      if (userId) {
        void saveUserLocalePreference(userId, next).catch(() => {
          /* non-blocking */
        })
      }
    }
  }, [userId])

  const setLocale = useCallback(
    (next: AppLocale) => {
      applyLocale(next, true)
    },
    [applyLocale],
  )

  const syncFromProfile = useCallback(
    (profileLocale: string | null | undefined) => {
      if (!profileLocale || !isAppLocale(profileLocale)) return
      applyLocale(profileLocale, false)
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, profileLocale)
      } catch {
        /* ignore */
      }
    },
    [applyLocale],
  )

  const registerUserId = useCallback((id: string | null) => {
    setUserId(id)
  }, [])

  useEffect(() => {
    const initial = readStoredLocale()
    applyLocale(initial, false)
  }, [applyLocale])

  const value = useMemo(
    () => ({
      locale,
      isRtl: isRtlLocale(locale),
      setLocale,
      syncFromProfile,
      registerUserId,
    }),
    [locale, setLocale, syncFromProfile, registerUserId],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
