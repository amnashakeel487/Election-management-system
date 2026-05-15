import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface MfaRouteProps {
  children: React.ReactNode
}

export function MfaRoute({ children }: MfaRouteProps) {
  const { session, authReady, mfaRequired, initError } = useAuth()

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <span className="font-body-md text-on-surface-variant">Loading…</span>
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

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!mfaRequired) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
