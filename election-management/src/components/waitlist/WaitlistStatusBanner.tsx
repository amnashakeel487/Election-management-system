import { waitlistUserMessage } from '@/utils/waitlistDisplay'

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
  return (
    <div className={`vr-status-box vr-status-box--waitlist ${className}`.trim()}>
      <p className="font-bold">{waitlistUserMessage(position)}</p>
      <p className="mt-1 text-xs opacity-90">
        You will be promoted automatically if a registered spot opens before the registration deadline.
        We email you when your status changes.
      </p>
      {onWithdraw ? (
        <button
          type="button"
          className="vr-btn-secondary mt-3 w-full"
          disabled={withdrawing}
          onClick={onWithdraw}
        >
          {withdrawing ? 'Withdrawing…' : 'Leave waitlist'}
        </button>
      ) : null}
    </div>
  )
}
