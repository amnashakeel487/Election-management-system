import { supabase } from '@/lib/supabase'
import { isThemePreference, type ThemePreference } from '@/types/theme'

export async function fetchUserThemePreference(userId: string): Promise<ThemePreference | null> {
  const { data, error } = await supabase
    .from('users')
    .select('theme_preference')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const raw = data?.theme_preference as string | undefined
  return isThemePreference(raw) ? raw : null
}

export async function saveUserThemePreference(
  userId: string,
  preference: ThemePreference,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ theme_preference: preference, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}
