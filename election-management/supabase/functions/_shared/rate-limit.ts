import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export async function enforceEdgeRateLimit(
  admin: SupabaseClient,
  bucket: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.rpc('enforce_rate_limit', {
    p_bucket: bucket,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    if (error.message.toLowerCase().includes('rate limit')) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export function getServiceAdmin(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceRoleKey)
}
