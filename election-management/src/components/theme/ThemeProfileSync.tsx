import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'

/** Applies theme from user profile when logged in; registers user id for DB persistence. */
export function ThemeProfileSync() {
  const { profile, user } = useAuth()
  const { syncFromProfile, registerUserId } = useTheme()

  useEffect(() => {
    registerUserId(user?.id ?? null)
  }, [registerUserId, user?.id])

  useEffect(() => {
    if (profile?.theme_preference) {
      syncFromProfile(profile.theme_preference)
    }
  }, [profile?.theme_preference, syncFromProfile])

  return null
}
