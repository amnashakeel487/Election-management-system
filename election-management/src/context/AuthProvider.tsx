import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
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
  loading: boolean
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
  const [loading, setLoading] = useState(true)
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

    async function init() {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setInitError(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on Vercel, then redeploy.',
          )
          setLoading(false)
        }
        return
      }

      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Session check timed out')), 12_000),
          ),
        ])

        if (!mounted) return

        setInitError(null)
        setSession(sessionResult.data.session)
        setUser(sessionResult.data.session?.user ?? null)
        await loadProfile(sessionResult.data.session?.user ?? null)
      } catch (err) {
        if (!mounted) return
        setInitError(
          err instanceof Error
            ? err.message
            : 'Could not connect to Supabase. Check env vars and that the project is not paused.',
        )
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void init()

    if (!isSupabaseConfigured) {
      return () => {
        mounted = false
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      await loadProfile(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
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
