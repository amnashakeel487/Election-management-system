import { Navigate, useLocation } from 'react-router-dom'
import { AuthSessionLoading } from '@/components/auth/AuthSessionLoading'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardPathForRole } from '@/utils/roleRoutes'

interface AdminGuestRouteProps {
  children: React.ReactNode
}

/** Admin sign-in only — not linked from the public login page. */
export function AdminGuestRoute({ children }: AdminGuestRouteProps) {
  const location = useLocation()
  const { session, profile, authReady, initError, emailVerified, mfaRequired, isRecoverySession } =
    useAuth()

  if (!authReady) {
    return <AuthSessionLoading />
  }

  if (session && profile && !isRecoverySession) {
    if (mfaRequired) {
      const from = (location.state as { from?: string } | null)?.from
      return <Navigate to="/mfa-verify" replace state={from ? { from } : undefined} />
    }
    if (!emailVerified) {
      return <Navigate to="/verify-email" replace />
    }
    if (profile.role === 'admin') {
      const from = (location.state as { from?: string } | null)?.from
      const target =
        from && (from === '/admin' || from.startsWith('/admin/')) ? from : '/admin/dashboard'
      return <Navigate to={target} replace />
    }
    return <Navigate to={getDashboardPathForRole(profile.role)} replace />
  }

  return (
    <>
      {initError ? (
        <div className="border-b border-error/30 bg-error-container/20 px-4 py-3 text-center">
          <p className="font-body-sm text-body-sm text-error">{initError}</p>
        </div>
      ) : null}
      {children}
    </>
  )
}
