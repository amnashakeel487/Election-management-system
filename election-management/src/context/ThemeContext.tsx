import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { saveUserThemePreference } from '@/services/themeService'
import { isThemePreference, type ResolvedTheme, type ThemePreference } from '@/types/theme'

type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  /** @deprecated use resolvedTheme */
  theme: ResolvedTheme
  setPreference: (mode: ThemePreference) => void
  toggleTheme: () => void
  syncFromProfile: (profilePreference: string | null | undefined) => void
  registerUserId: (userId: string | null) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'fv-theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') return getSystemTheme()
  return preference
}

function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (isThemePreference(v)) return v
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return 'system'
}

function applyDomTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.add('theme-transition')
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  window.setTimeout(() => root.classList.remove('theme-transition'), 400)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredPreference()))
  const [userId, setUserId] = useState<string | null>(null)

  const persistPreference = useCallback(
    (next: ThemePreference) => {
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      if (userId) {
        void saveUserThemePreference(userId, next).catch(() => {
          /* non-blocking */
        })
      }
    },
    [userId],
  )

  const applyPreference = useCallback(
    (mode: ThemePreference, persist: boolean) => {
      setPreferenceState(mode)
      const resolved = resolveTheme(mode)
      setResolvedTheme(resolved)
      applyDomTheme(resolved)
      if (persist) persistPreference(mode)
    },
    [persistPreference],
  )

  const setPreference = useCallback(
    (mode: ThemePreference) => {
      applyPreference(mode, true)
    },
    [applyPreference],
  )

  const syncFromProfile = useCallback(
    (profilePreference: string | null | undefined) => {
      if (!profilePreference || !isThemePreference(profilePreference)) return
      applyPreference(profilePreference, false)
      try {
        localStorage.setItem(STORAGE_KEY, profilePreference)
      } catch {
        /* ignore */
      }
    },
    [applyPreference],
  )

  const registerUserId = useCallback((id: string | null) => {
    setUserId(id)
  }, [])

  useEffect(() => {
    const initial = readStoredPreference()
    applyPreference(initial, false)
  }, [applyPreference])

  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const resolved = getSystemTheme()
      setResolvedTheme(resolved)
      applyDomTheme(resolved)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const toggleTheme = useCallback(() => {
    setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setPreference])

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      theme: resolvedTheme,
      setPreference,
      toggleTheme,
      syncFromProfile,
      registerUserId,
    }),
    [preference, resolvedTheme, setPreference, toggleTheme, syncFromProfile, registerUserId],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
