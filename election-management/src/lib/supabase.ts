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
  },
})
