import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface CreatorApprovedRouteProps {
  children: React.ReactNode
}

export function CreatorApprovedRoute({ children }: CreatorApprovedRouteProps) {
  const { profile, loading } = useAuth()

  if (loading) {
    return <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Loading…</p>
  }

  if (profile?.role === 'election_creator' && profile.approval_status !== 'approved') {
    return <Navigate to="/creator/dashboard" replace />
  }

  return <>{children}</>
}
