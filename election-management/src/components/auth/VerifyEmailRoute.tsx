import { Navigate, useLocation } from 'react-router-dom'
import { AuthSessionLoading } from '@/components/auth/AuthSessionLoading'
import { useAuth } from '@/hooks/useAuth'
import { safeReturnPathForRole } from '@/utils/safeReturnPath'

interface VerifyEmailRouteProps {
  children: React.ReactNode
}

type VerifyEmailLocationState = {
  email?: string
}

/** Allows pending signup (no session) or authenticated unverified users. */
export function VerifyEmailRoute({ children }: VerifyEmailRouteProps) {
  const { session, profile, authReady, emailVerified } = useAuth()
  const location = useLocation()
  const pendingEmail = (location.state as VerifyEmailLocationState | null)?.email

  if (pendingEmail) {
    return <>{children}</>
  }

  if (!authReady) {
    return <AuthSessionLoading />
  }

  if (!session && !pendingEmail) {
    return <Navigate to="/login" replace />
  }

  if (session && emailVerified && profile) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={safeReturnPathForRole(from, profile.role)} replace />
  }

  return <>{children}</>
}
