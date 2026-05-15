import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface GuestRouteProps {
  children: React.ReactNode
}

/** Redirect authenticated users away from login/register. */
export function GuestRoute({ children }: GuestRouteProps) {
  const { session, profile, loading, initError, emailVerified, getDashboardPath } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
        <span className="font-body-md text-body-md text-on-surface-variant">Loading…</span>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6 text-on-surface">
        <div className="max-w-md rounded-2xl border border-error/30 bg-error-container/10 p-6 text-center">
          <p className="mb-2 font-headline-md text-headline-md text-error">Connection problem</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{initError}</p>
          <p className="mt-4 font-body-sm text-body-sm text-on-surface-variant">
            Fix Vercel environment variables and redeploy, or check Supabase project status.
          </p>
        </div>
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
