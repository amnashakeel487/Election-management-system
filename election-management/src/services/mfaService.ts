import { assertSupabaseConfigured, supabase } from '@/lib/supabase'

export async function listMfaFactors() {
  assertSupabaseConfigured()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw new Error(error.message)
  return data
}

export async function enrollTotpFactor() {
  assertSupabaseConfigured()
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'FortressVote Authenticator',
  })
  if (error) throw new Error(error.message)
  return data
}

export async function verifyTotpEnrollment(factorId: string, code: string) {
  assertSupabaseConfigured()
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error) throw new Error(challenge.error.message)

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function unenrollMfaFactor(factorId: string) {
  assertSupabaseConfigured()
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw new Error(error.message)
}

export async function getVerifiedTotpFactor() {
  const { totp } = await listMfaFactors()
  return totp.find((f) => f.status === 'verified') ?? null
}

export async function challengeAndVerifyMfa(factorId: string, code: string) {
  assertSupabaseConfigured()
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error) throw new Error(challenge.error.message)

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  })
  if (error) throw new Error(error.message)
  return data
}
