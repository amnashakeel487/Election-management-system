import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl?.startsWith('https://') && supabaseAnonKey && supabaseAnonKey.length > 20,
)

if (!isSupabaseConfigured) {
  const hint = import.meta.env.PROD
    ? 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel → Environment Variables, then redeploy. See docs/DEPLOY.md.'
    : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).'
  console.error(`Supabase configuration missing or invalid. ${hint}`)
}

/** Call before auth/API requests so users see a clear message instead of "Failed to fetch". */
export function assertSupabaseConfigured(): void {
  if (isSupabaseConfigured) return
  throw new Error(
    import.meta.env.PROD
      ? 'Cannot connect to Supabase. In Vercel → Settings → Environment Variables, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (from Supabase → Project Settings → API), then redeploy.'
      : 'Cannot connect to Supabase. Copy .env.example to .env and add your project URL and anon key.',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

/** Safe to show in UI (confirms Vercel build received env vars). */
export function getSupabaseHostLabel(): string {
  if (!supabaseUrl) return 'not set at build time'
  try {
    return new URL(supabaseUrl).hostname
  } catch {
    return 'invalid URL'
  }
}

export function getSupabaseProjectRef(): string | null {
  if (!supabaseUrl) return null
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] ?? null
  } catch {
    return null
  }
}

/** Clears stuck auth tokens (fixes hanging getSession on some browsers). */
export function clearSupabaseAuthStorage(): void {
  const ref = getSupabaseProjectRef()
  if (ref) {
    localStorage.removeItem(`sb-${ref}-auth-token`)
  }
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.includes('auth')) {
      localStorage.removeItem(key)
    }
  }
}

export async function checkSupabaseHealth(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return { ok: false, message: 'Env vars missing in this build (redeploy Vercel after adding them).' }
  }
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  }
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, { method: 'GET', headers })
    if (res.ok) return { ok: true, message: 'Supabase API reachable' }
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message: 'API rejected the anon key — confirm VITE_SUPABASE_ANON_KEY matches Supabase → Settings → API.',
      }
    }
    return { ok: false, message: `Health check returned ${res.status}` }
  } catch {
    return { ok: false, message: 'Cannot reach Supabase (network, ad blocker, or wrong URL).' }
  }
}
