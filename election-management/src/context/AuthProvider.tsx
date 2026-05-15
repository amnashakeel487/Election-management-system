import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
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
      const { data } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(data.session)
      setUser(data.session?.user ?? null)
      await loadProfile(data.session?.user ?? null)
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
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
