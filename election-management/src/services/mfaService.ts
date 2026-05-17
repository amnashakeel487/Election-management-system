import { assertSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Factor } from '@supabase/supabase-js'

export const MFA_TOTP_FRIENDLY_NAME = 'FortressVote Authenticator'

export async function listMfaFactors() {
  assertSupabaseConfigured()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw new Error(error.message)
  return data
}

export async function getTotpFactorState(): Promise<{
  verified: Factor | null
  unverified: Factor[]
}> {
  const { totp } = await listMfaFactors()
  return {
    verified: totp.find((f) => f.status === 'verified') ?? null,
    unverified: totp.filter((f) => f.status !== 'verified'),
  }
}

/** Remove incomplete TOTP enrollments so a fresh QR can be issued. */
export async function removeUnverifiedTotpFactors(): Promise<number> {
  const { unverified } = await getTotpFactorState()
  for (const f of unverified) {
    await unenrollMfaFactor(f.id)
  }
  return unverified.length
}

export async function enrollTotpFactor() {
  assertSupabaseConfigured()
  const { verified, unverified } = await getTotpFactorState()
  if (verified) {
    throw new Error('Two-factor authentication is already enabled on this account.')
  }
  if (unverified.length > 0) {
    await removeUnverifiedTotpFactors()
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: MFA_TOTP_FRIENDLY_NAME,
  })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already exists')) {
      await removeUnverifiedTotpFactors()
      const retry = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: MFA_TOTP_FRIENDLY_NAME,
      })
      if (retry.error) throw new Error(retry.error.message)
      return retry.data
    }
    throw new Error(error.message)
  }
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
  const { verified } = await getTotpFactorState()
  return verified
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
