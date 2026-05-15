import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { clearSupabaseAuthStorage, isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  fetchUserProfile,
  isEmailVerified,
  signInWithEmail,
  signOut as authSignOut,
  signUpWithEmail,
  resendVerificationEmail,
} from '@/services/authService'
import type { AuthCredentials, SignUpPayload, UserProfile } from '@/types/auth'
import { logAuditEvent } from '@/services/auditService'
import { AUDIT_ACTIONS } from '@/types/audit'
import { getDashboardPathForRole } from '@/utils/roleRoutes'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  /** @deprecated Use authReady for route guards; stays false so login/register never block. */
  loading: boolean
  authReady: boolean
  initError: string | null
  emailVerified: boolean
  signIn: (credentials: AuthCredentials) => Promise<string>
  signUp: (payload: SignUpPayload) => Promise<void>
  signOut: () => Promise<void>
  resendVerification: () => Promise<void>
  refreshProfile: () => Promise<void>
  getDashboardPath: () => string | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const emailVerified = isEmailVerified(user?.email_confirmed_at)

  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null)
      return
    }

    try {
      const row = await fetchUserProfile(authUser.id)
      setProfile(row)
    } catch {
      setProfile(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user)
  }, [loadProfile, user])

  useEffect(() => {
    let mounted = true

    if (!isSupabaseConfigured) {
      setInitError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on Vercel, then redeploy.',
      )
      setAuthReady(true)
      return () => {
        mounted = false
      }
    }

    let sessionResolved = false

    const markReady = () => {
      if (mounted) setAuthReady(true)
    }

    // Dashboards wait at most 3s for session probe; login/register never block.
    const unlockTimer = window.setTimeout(markReady, 3000)

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return
      sessionResolved = true
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setInitError(null)
      markReady()
      void loadProfile(nextSession?.user ?? null)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession)
    })

    const loadSession = () =>
      supabase.auth.getSession().then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          console.warn('getSession:', error.message)
          setInitError(
            'Slow or failed connection to Supabase. Try “Clear cached login” below, then sign in again.',
          )
          return
        }
        void applySession(data.session)
      })

    void loadSession().catch((err) => {
      if (!mounted) return
      console.warn('getSession failed:', err)
      setInitError('Cannot reach Supabase. Check diagnostics below, then clear cache or redeploy Vercel.')
    })

    // If getSession hangs, retry once after clearing stale tokens.
    const retryTimer = window.setTimeout(() => {
      if (!mounted || sessionResolved) return
      clearSupabaseAuthStorage()
      void loadSession()
    }, 2500)

    return () => {
      mounted = false
      window.clearTimeout(unlockTimer)
      window.clearTimeout(retryTimer)
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (credentials: AuthCredentials) => {
    const { session: nextSession } = await signInWithEmail(credentials)
    if (!nextSession?.user) throw new Error('Sign in failed')

    const row = await fetchUserProfile(nextSession.user.id)
    if (!row) throw new Error('User profile not found. Contact support.')

    setSession(nextSession)
    setUser(nextSession.user)
    setProfile(row)

    void logAuditEvent(AUDIT_ACTIONS.USER_LOGIN, {
      email: row.email,
      role: row.role,
    }).catch(() => {
      /* audit must not block login */
    })

    if (!isEmailVerified(nextSession.user.email_confirmed_at)) {
      return '/verify-email'
    }

    return getDashboardPathForRole(row.role)
  }, [])

  const signUp = useCallback(async (payload: SignUpPayload) => {
    await signUpWithEmail(payload)
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  const resendVerification = useCallback(async () => {
    if (!user?.email) throw new Error('No email on file')
    await resendVerificationEmail(user.email)
  }, [user?.email])

  const getDashboardPath = useCallback(() => {
    if (!profile) return null
    return getDashboardPathForRole(profile.role)
  }, [profile])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      authReady,
      initError,
      emailVerified,
      signIn,
      signUp,
      signOut,
      resendVerification,
      refreshProfile,
      getDashboardPath,
    }),
    [
      session,
      user,
      profile,
      loading,
      authReady,
      initError,
      emailVerified,
      signIn,
      signUp,
      signOut,
      resendVerification,
      refreshProfile,
      getDashboardPath,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
