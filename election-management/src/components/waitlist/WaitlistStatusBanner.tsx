import { useTranslation } from 'react-i18next'
import { useWaitlistMessage } from '@/hooks/useWaitlistMessage'

export interface WaitlistStatusBannerProps {
  position: number | null | undefined
  className?: string
  onWithdraw?: () => void
  withdrawing?: boolean
}

export function WaitlistStatusBanner({
  position,
  className = '',
  onWithdraw,
  withdrawing = false,
}: WaitlistStatusBannerProps) {
  const { t } = useTranslation('waitlist')
  const formatWaitlist = useWaitlistMessage()

  return (
    <div className={`vr-status-box vr-status-box--waitlist ${className}`.trim()}>
      <p className="font-bold">{formatWaitlist(position)}</p>
      <p className="mt-1 text-xs opacity-90">{t('promoteHint')}</p>
      {onWithdraw ? (
        <button
          type="button"
          className="vr-btn-secondary mt-3 w-full"
          disabled={withdrawing}
          onClick={onWithdraw}
        >
          {withdrawing ? t('leaving') : t('leaveWaitlist')}
        </button>
      ) : null}
    </div>
  )
}
