import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { clearSupabaseAuthStorage, isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  fetchUserProfile,
  isEmailVerified,
  signInWithEmail,
  signOut as authSignOut,
  signUpWithEmail,
  resendVerificationEmail,
  waitForUserProfile,
} from '@/services/authService'
import { getVerifiedTotpFactor } from '@/services/mfaService'
import { RoleMismatchError } from '@/lib/errors/roleMismatch'
import type { SignInPayload, SignUpPayload, UserProfile } from '@/types/auth'
import { logAuditEvent } from '@/services/auditService'
import { AUDIT_ACTIONS } from '@/types/audit'
import { getDashboardPathForRole } from '@/utils/roleRoutes'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  authReady: boolean
  initError: string | null
  emailVerified: boolean
  isRecoverySession: boolean
  mfaRequired: boolean
  signIn: (credentials: SignInPayload) => Promise<string>
  signUp: (payload: SignUpPayload) => Promise<void>
  signOut: () => Promise<void>
  resendVerification: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSession: () => Promise<void>
  clearRecoverySession: () => void
  getDashboardPath: () => string | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

async function checkMfaRequired(): Promise<boolean> {
  try {
    const factor = await getVerifiedTotpFactor()
    if (!factor) return false
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error) return false
    return data.currentLevel === 'aal1' && data.nextLevel === 'aal2'
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [isRecoverySession, setIsRecoverySession] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)

  const loading = !authReady
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

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(error.message)
    setSession(data.session)
    setUser(data.session?.user ?? null)
    await loadProfile(data.session?.user ?? null)
    const needsMfa = await checkMfaRequired()
    setMfaRequired(needsMfa)
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user)
  }, [loadProfile, user])

  const clearRecoverySession = useCallback(() => {
    setIsRecoverySession(false)
  }, [])

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

    const unlockTimer = window.setTimeout(markReady, 3000)

    const applySession = async (nextSession: Session | null, event?: AuthChangeEvent) => {
      if (!mounted) return
      sessionResolved = true
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setInitError(null)

      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        setIsRecoverySession(true)
      } else if (event === 'SIGNED_OUT') {
        setIsRecoverySession(false)
        setMfaRequired(false)
      }

      if (nextSession?.user) {
        const needsMfa = await checkMfaRequired()
        if (mounted) setMfaRequired(needsMfa)
      } else if (mounted) {
        setMfaRequired(false)
      }

      markReady()
      void loadProfile(nextSession?.user ?? null)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void applySession(nextSession, event)
    })

    const loadSession = () =>
      supabase.auth.getSession().then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          console.warn('getSession:', error.message)
          setInitError(
            'Slow or failed connection to Supabase. Try “Clear cached login” below, then sign in again.',
          )
          markReady()
          return
        }
        if (data.session) {
          const hash = window.location.hash
          const search = window.location.search
          if (
            hash.includes('type=recovery') ||
            search.includes('code=') ||
            (search.includes('token_hash=') && search.includes('type=recovery'))
          ) {
            setIsRecoverySession(true)
          }
        }
        void applySession(data.session)
      })

    void loadSession().catch((err) => {
      if (!mounted) return
      console.warn('getSession failed:', err)
      setInitError('Cannot reach Supabase. Check diagnostics below, then clear cache or redeploy Vercel.')
      markReady()
    })

    const retryTimer = window.setTimeout(() => {
      if (!mounted || sessionResolved) return
      if (window.location.pathname.includes('reset-password')) return
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

  const signIn = useCallback(async (credentials: SignInPayload) => {
    const { session: nextSession } = await signInWithEmail(credentials)
    if (!nextSession?.user) throw new Error('Sign in failed')

    const row = (await waitForUserProfile(nextSession.user.id)) ?? (await fetchUserProfile(nextSession.user.id))
    if (!row) throw new Error('User profile not found. Contact support.')

    if (row.role !== credentials.loginAsRole) {
      await authSignOut()
      throw new RoleMismatchError(row.role, credentials.loginAsRole)
    }

    setSession(nextSession)
    setUser(nextSession.user)
    setProfile(row)

    void logAuditEvent(AUDIT_ACTIONS.USER_LOGIN, {
      email: row.email,
      role: row.role,
    }).catch(() => {
      /* audit must not block login */
    })

    const needsMfa = await checkMfaRequired()
    setMfaRequired(needsMfa)
    if (needsMfa) {
      return '/mfa-verify'
    }

    if (!isEmailVerified(nextSession.user.email_confirmed_at)) {
      return '/verify-email'
    }

    return getDashboardPathForRole(row.role)
  }, [])

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const { user: newUser } = await signUpWithEmail(payload)
    void logAuditEvent(AUDIT_ACTIONS.USER_SIGNUP, {
      email: payload.email,
      role: payload.role,
    }).catch(() => {
      /* audit must not block signup */
    })
    if (newUser) {
      await waitForUserProfile(newUser.id)
    }
  }, [])

  const signOut = useCallback(async () => {
    const email = profile?.email
    const role = profile?.role
    await authSignOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    setMfaRequired(false)
    setIsRecoverySession(false)
    if (email) {
      void logAuditEvent(AUDIT_ACTIONS.USER_LOGOUT, { email, role }).catch(() => {
        /* non-blocking */
      })
    }
  }, [profile?.email, profile?.role])

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
      isRecoverySession,
      mfaRequired,
      signIn,
      signUp,
      signOut,
      resendVerification,
      refreshProfile,
      refreshSession,
      clearRecoverySession,
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
      isRecoverySession,
      mfaRequired,
      signIn,
      signUp,
      signOut,
      resendVerification,
      refreshProfile,
      refreshSession,
      clearRecoverySession,
      getDashboardPath,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
