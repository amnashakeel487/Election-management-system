import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface CreatorApprovedRouteProps {
  children: React.ReactNode
}

export function CreatorApprovedRoute({ children }: CreatorApprovedRouteProps) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
        <span className="font-body-md text-body-md text-on-surface-variant">Loading…</span>
      </div>
    )
  }

  if (profile?.role === 'election_creator' && profile.approval_status !== 'approved') {
    return <Navigate to="/creator/dashboard" replace />
  }

  return <>{children}</>
}
