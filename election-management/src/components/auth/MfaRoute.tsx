import { Navigate, useLocation } from 'react-router-dom'
import { AuthSessionLoading } from '@/components/auth/AuthSessionLoading'
import { useAuth } from '@/hooks/useAuth'
import { safeReturnPathForRole } from '@/utils/safeReturnPath'

interface MfaRouteProps {
  children: React.ReactNode
}

export function MfaRoute({ children }: MfaRouteProps) {
  const location = useLocation()
  const { session, profile, authReady, mfaRequired, initError } = useAuth()

  if (!authReady) {
    return <AuthSessionLoading />
  }

  if (initError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <p className="max-w-md text-center font-body-sm text-error">{initError}</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!mfaRequired) {
    const from = (location.state as { from?: string } | null)?.from
    if (profile) {
      return <Navigate to={safeReturnPathForRole(from, profile.role)} replace />
    }
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
