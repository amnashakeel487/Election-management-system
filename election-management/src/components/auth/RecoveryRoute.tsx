import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { hasRecoveryParamsInUrl } from '@/utils/recoverySession'

interface RecoveryRouteProps {
  children: React.ReactNode
}

/** Password reset: allow recovery tokens in URL or an active recovery session. */
export function RecoveryRoute({ children }: RecoveryRouteProps) {
  const { authReady, initError, isRecoverySession, session } = useAuth()

  const canAccess = hasRecoveryParamsInUrl() || isRecoverySession || Boolean(session)

  if (!authReady) {
    return <AuthHoldScreen message="Preparing secure reset…" />
  }

  if (initError) {
    return <AuthHoldScreen message={initError} error />
  }

  if (!canAccess) {
    return <Navigate to="/forgot-password" replace />
  }

  return <>{children}</>
}

function AuthHoldScreen({ message, error }: { message: string; error?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <p className={`max-w-md text-center font-body-sm ${error ? 'text-error' : 'text-on-surface-variant'}`}>
        {message}
      </p>
    </div>
  )
}
