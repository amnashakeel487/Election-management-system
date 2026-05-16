import { supabase } from '@/lib/supabase'

export interface SecuritySettings {
  captcha_enabled: boolean
  captcha_provider: 'checkbox' | 'turnstile'
  rate_limit_auth_per_minute: number
  rate_limit_vote_verify_per_minute: number
  rate_limit_vote_cast_per_minute: number
  ballot_sealing_enabled: boolean
  maintenance_mode: boolean
  updated_at: string | null
}

export interface SecurityPosture {
  settings: SecuritySettings
  rls_tables: Array<{ table: string; rls: boolean }>
  direct_ballot_writes_blocked: boolean
  ballots_have_seal_column: boolean
}

export async function fetchSecurityPosture(): Promise<SecurityPosture> {
  const { data, error } = await supabase.rpc('get_security_posture')
  if (error) throw new Error(error.message)
  return data as SecurityPosture
}

export async function updateSecuritySettings(
  patch: Partial<SecuritySettings>,
): Promise<SecurityPosture> {
  const { data, error } = await supabase.rpc('admin_update_security_settings', {
    p_patch: patch,
  })
  if (error) throw new Error(error.message)
  return data as SecurityPosture
}

export async function verifyCaptchaToken(
  token: string,
  action = 'auth',
): Promise<{ ok: boolean; error?: string; mode?: string }> {
  const { data, error } = await supabase.functions.invoke('verify-turnstile', {
    body: { token, action },
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  const payload = data as { ok?: boolean; error?: string; mode?: string }
  return { ok: Boolean(payload?.ok), error: payload?.error, mode: payload?.mode }
}

export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? ''
export const turnstileConfigured = Boolean(turnstileSiteKey)
