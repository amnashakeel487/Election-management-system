import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

export function CreatorApprovalBanner() {
  const { profile } = useAuth()
  const { t } = useTranslation('creator')
  const status = profile?.approval_status

  if (status === 'pending') {
    return (
      <div className="alert-banner alert-banner--warn">
        <strong>{t('approval.pendingTitle')}</strong>
        <p style={{ marginTop: 6 }}>{t('approval.pendingBody')}</p>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="alert-banner alert-banner--error">{t('approval.rejected')}</div>
    )
  }

  return null
}
