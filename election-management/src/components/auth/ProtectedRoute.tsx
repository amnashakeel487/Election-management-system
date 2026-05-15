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
  const { session, profile, loading, emailVerified, getDashboardPath } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
        <span className="font-body-md text-body-md text-on-surface-variant">Loading secure session…</span>
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
