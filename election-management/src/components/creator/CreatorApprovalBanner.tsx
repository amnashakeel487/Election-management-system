import { useAuth } from '@/hooks/useAuth'

export function CreatorApprovalBanner() {
  const { profile } = useAuth()
  const status = profile?.approval_status

  if (status === 'pending') {
    return (
      <div className="alert-banner alert-banner--warn">
        <strong>Pending admin approval</strong>
        <p style={{ marginTop: 6 }}>
          Your election creator access request is under review. You can create elections once approved.
        </p>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="alert-banner alert-banner--error">
        Your creator application was rejected. Contact support if you believe this is an error.
      </div>
    )
  }

  return null
}
