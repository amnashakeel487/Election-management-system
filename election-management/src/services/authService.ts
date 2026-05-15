import { assertSupabaseConfigured, supabase } from '@/lib/supabase'
import { establishRecoverySession } from '@/utils/recoverySession'
import type { AuthCredentials, RegisterableRole, SignUpPayload, UserProfile } from '@/types/auth'
import { REGISTERABLE_ROLES } from '@/types/auth'

const USERS_TABLE = 'users'

const PROFILE_COLUMNS =
  'id, email, role, approval_status, full_name, phone, organization, election_purpose, rejection_reason, created_at, updated_at'

function wrapAuthError(err: unknown): Error {
  if (err instanceof Error) {
    const lower = err.message.toLowerCase()
    if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
      return new Error(
        'Network error: cannot reach Supabase. Check Vercel env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), redeploy, and ensure your Supabase project is not paused.',
      )
    }
    return err
  }
  return new Error('Authentication failed')
}

export function isEmailVerified(emailConfirmedAt: string | null | undefined): boolean {
  return Boolean(emailConfirmedAt)
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as UserProfile | null
}

export async function signInWithEmail({ email, password }: AuthCredentials) {
  assertSupabaseConfigured()
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  } catch (err) {
    throw wrapAuthError(err)
  }
}

function assertRegisterableRole(role: string): asserts role is RegisterableRole {
  if (!REGISTERABLE_ROLES.includes(role as RegisterableRole)) {
    throw new Error('Invalid account type. Super Admin accounts must be provisioned by the platform.')
  }
}

export async function signUpWithEmail(payload: SignUpPayload) {
  assertSupabaseConfigured()
  assertRegisterableRole(payload.role)
  const redirectTo = `${window.location.origin}/verify-email`
  const { email, password, role, full_name, phone, organization, election_purpose } = payload

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          role,
          full_name,
          phone,
          organization: organization ?? '',
          election_purpose: role === 'election_creator' ? (election_purpose ?? '') : '',
        },
      },
    })

    if (error) throw new Error(error.message)
    return data
  } catch (err) {
    throw wrapAuthError(err)
  }
}

export async function requestPasswordReset(email: string) {
  assertSupabaseConfigured()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw new Error(error.message)
}

export async function updatePassword(newPassword: string) {
  assertSupabaseConfigured()

  const { data: current } = await supabase.auth.getSession()
  let session = current.session
  if (!session) {
    session = await establishRecoverySession()
  }
  if (!session) {
    throw new Error('Your reset link has expired or was already used. Request a new password reset email.')
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/verify-email`,
    },
  })
  if (error) throw new Error(error.message)
}

export async function refreshAuthSession() {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw new Error(error.message)
  return data.session
}

/** Waits for profile row after signup trigger (handles brief replication delay). */
export async function waitForUserProfile(userId: string, attempts = 5): Promise<UserProfile | null> {
  for (let i = 0; i < attempts; i += 1) {
    const row = await fetchUserProfile(userId)
    if (row) return row
    await new Promise((resolve) => window.setTimeout(resolve, 400 * (i + 1)))
  }
  return null
}
