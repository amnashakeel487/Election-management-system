import { Navigate, useLocation } from 'react-router-dom'
import { AuthSessionLoading } from '@/components/auth/AuthSessionLoading'
import { useAuth } from '@/hooks/useAuth'
import { safeReturnPathForRole } from '@/utils/safeReturnPath'

interface GuestRouteProps {
  children: React.ReactNode
}

/** Login/register: show form for guests; restore prior dashboard URL after session loads. */
export function GuestRoute({ children }: GuestRouteProps) {
  const location = useLocation()
  const { session, profile, authReady, initError, emailVerified, mfaRequired, isRecoverySession } =
    useAuth()

  const showConnectionBanner = Boolean(initError)

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
    const from = (location.state as { from?: string } | null)?.from
    const target = safeReturnPathForRole(from, profile.role)
    return <Navigate to={target} replace />
  }

  return (
    <>
      {showConnectionBanner ? (
        <div className="border-b border-error/30 bg-error-container/20 px-4 py-3 text-center">
          <p className="font-body-sm text-body-sm text-error">{initError}</p>
          <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
            You can still try to sign in — if it fails, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel and
            redeploy.
          </p>
        </div>
      ) : null}
      {children}
    </>
  )
}
