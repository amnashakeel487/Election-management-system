import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireVerifiedEmail?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireVerifiedEmail = true,
}: ProtectedRouteProps) {
  const { session, profile, authReady, initError, emailVerified, getDashboardPath } = useAuth()
  const location = useLocation()

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
        <span className="font-body-md text-body-md text-on-surface-variant">Loading secure session…</span>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <p className="max-w-md text-center font-body-sm text-error">{initError}</p>
      </div>
    )
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireVerifiedEmail && !emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const fallback = getDashboardPath() ?? '/'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
