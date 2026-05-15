import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface GuestRouteProps {
  children: React.ReactNode
}

/** Login/register: always show the form; redirect only when session is known. */
export function GuestRoute({ children }: GuestRouteProps) {
  const { session, profile, authReady, initError, emailVerified, mfaRequired, isRecoverySession, getDashboardPath } =
    useAuth()

  const showConnectionBanner = Boolean(initError)

  if (authReady && session && profile && !isRecoverySession) {
    if (mfaRequired) {
      return <Navigate to="/mfa-verify" replace />
    }
    if (!emailVerified) {
      return <Navigate to="/verify-email" replace />
    }
    const dashboard = getDashboardPath()
    if (dashboard) return <Navigate to={dashboard} replace />
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
