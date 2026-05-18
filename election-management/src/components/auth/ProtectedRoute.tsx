import { Navigate, useLocation } from 'react-router-dom'
import { AuthSessionLoading } from '@/components/auth/AuthSessionLoading'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireVerifiedEmail?: boolean
  /** Where to send unauthenticated users (default /login). */
  loginPath?: string
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireVerifiedEmail = true,
  loginPath = '/login',
}: ProtectedRouteProps) {
  const { session, profile, authReady, initError, emailVerified, mfaRequired, getDashboardPath } = useAuth()
  const location = useLocation()

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

  if (session && !profile) {
    return <AuthSessionLoading message="Loading your profile…" />
  }

  if (!session || !profile) {
    const returnPath = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={loginPath} replace state={{ from: returnPath }} />
  }

  if (mfaRequired) {
    return <Navigate to="/mfa-verify" replace state={{ from: `${location.pathname}${location.search}` }} />
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
