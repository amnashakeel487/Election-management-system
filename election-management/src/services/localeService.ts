import { supabase } from '@/lib/supabase'
import { isAppLocale, type AppLocale } from '@/types/locale'

export async function fetchUserLocalePreference(userId: string): Promise<AppLocale | null> {
  const { data, error } = await supabase
    .from('users')
    .select('locale_preference')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const raw = data?.locale_preference as string | undefined
  return isAppLocale(raw) ? raw : null
}

export async function saveUserLocalePreference(userId: string, locale: AppLocale): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ locale_preference: locale, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}
