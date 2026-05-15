import type { Session } from '@supabase/supabase-js'
import { assertSupabaseConfigured, supabase } from '@/lib/supabase'

/** True when the URL still carries Supabase password-recovery parameters. */
export function hasRecoveryParamsInUrl(): boolean {
  const hash = window.location.hash
  const search = window.location.search
  return (
    hash.includes('type=recovery') ||
    hash.includes('access_token=') ||
    search.includes('code=') ||
    (search.includes('token_hash=') && search.includes('type=recovery'))
  )
}

function stripRecoveryParamsFromUrl(): void {
  const url = new URL(window.location.href)
  url.hash = ''
  for (const key of ['code', 'token_hash', 'type', 'error', 'error_description']) {
    url.searchParams.delete(key)
  }
  const search = url.searchParams.toString()
  window.history.replaceState({}, '', search ? `${url.pathname}?${search}` : url.pathname)
}

/**
 * Exchanges recovery tokens from the email link for a Supabase auth session.
 * Supports PKCE (?code=), OTP (?token_hash=), and legacy hash (#access_token=) links.
 */
export async function establishRecoverySession(): Promise<Session | null> {
  assertSupabaseConfigured()

  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  const code = searchParams.get('code')
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw new Error(error.message)
    stripRecoveryParamsFromUrl()
    return data.session
  }

  const tokenHash = searchParams.get('token_hash')
  const otpType = searchParams.get('type')
  if (tokenHash && otpType === 'recovery') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    })
    if (error) throw new Error(error.message)
    stripRecoveryParamsFromUrl()
    return data.session
  }

  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) throw new Error(error.message)
    stripRecoveryParamsFromUrl()
    return data.session
  }

  const { data: existing, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(sessionError.message)
  if (existing.session) {
    if (hasRecoveryParamsInUrl()) stripRecoveryParamsFromUrl()
    return existing.session
  }

  if (hasRecoveryParamsInUrl()) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 400))
      const { data: retry } = await supabase.auth.getSession()
      if (retry.session) {
        stripRecoveryParamsFromUrl()
        return retry.session
      }
    }
  }

  return null
}
