import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface VerifyEmailRouteProps {
  children: React.ReactNode
}

type VerifyEmailLocationState = {
  email?: string
}

/** Allows pending signup (no session) or authenticated unverified users. */
export function VerifyEmailRoute({ children }: VerifyEmailRouteProps) {
  const { session, profile, loading, emailVerified, getDashboardPath } = useAuth()
  const location = useLocation()
  const pendingEmail = (location.state as VerifyEmailLocationState | null)?.email

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-background">
        <span className="font-body-md text-body-md text-on-surface-variant">Loading…</span>
      </div>
    )
  }

  if (!session && !pendingEmail) {
    return <Navigate to="/login" replace />
  }

  if (session && emailVerified && profile) {
    const dashboard = getDashboardPath()
    if (dashboard) return <Navigate to={dashboard} replace />
  }

  return <>{children}</>
}
