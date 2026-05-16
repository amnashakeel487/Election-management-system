import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/context/LocaleContext'

/** Applies locale from user profile when logged in; registers user id for DB persistence. */
export function LocaleProfileSync() {
  const { profile, user } = useAuth()
  const { syncFromProfile, registerUserId } = useLocale()

  useEffect(() => {
    registerUserId(user?.id ?? null)
  }, [registerUserId, user?.id])

  useEffect(() => {
    if (profile?.locale_preference) {
      syncFromProfile(profile.locale_preference)
    }
  }, [profile?.locale_preference, syncFromProfile])

  return null
}
