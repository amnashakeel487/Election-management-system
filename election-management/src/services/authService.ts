import { supabase } from '@/lib/supabase'
import type { AuthCredentials, SignUpPayload, UserProfile, UserRole } from '@/types/auth'

const USERS_TABLE = 'users'

export function isEmailVerified(emailConfirmedAt: string | null | undefined): boolean {
  return Boolean(emailConfirmedAt)
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('id, email, role, approval_status, full_name, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as UserProfile | null
}

export async function signInWithEmail({ email, password }: AuthCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function signUpWithEmail({ email, password, role }: SignUpPayload) {
  const redirectTo = `${window.location.origin}/verify-email`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: { role },
    },
  })

  if (error) throw new Error(error.message)

  if (data.user) {
    await upsertUserProfile(data.user.id, email, role)
  }

  return data
}

export async function upsertUserProfile(userId: string, email: string, role: UserRole) {
  const approval_status = role === 'election_creator' ? 'pending' : 'approved'

  const { error } = await supabase.from(USERS_TABLE).upsert(
    {
      id: userId,
      email,
      role,
      approval_status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

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
