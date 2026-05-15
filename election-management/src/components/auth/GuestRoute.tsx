import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface GuestRouteProps {
  children: React.ReactNode
}

/** Redirect authenticated users away from login/register. */
export function GuestRoute({ children }: GuestRouteProps) {
  const { session, profile, loading, emailVerified, getDashboardPath } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
        <span className="font-body-md text-body-md text-on-surface-variant">Loading…</span>
      </div>
    )
  }

  if (session && profile) {
    if (!emailVerified) {
      return <Navigate to="/verify-email" replace />
    }
    const dashboard = getDashboardPath()
    if (dashboard) return <Navigate to={dashboard} replace />
  }

  return <>{children}</>
}
