import { useLiveClock } from '@/hooks/useLiveClock'
import '@/styles/dashboard-widgets.css'

export type LiveClockVariant = 'default' | 'landing' | 'hero' | 'compact'

export interface LiveClockProps {
  variant?: LiveClockVariant
  className?: string
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function LiveClock({ variant = 'default', className = '' }: LiveClockProps) {
  const { weekday, date, time } = useLiveClock()

  if (variant === 'compact') {
    const compactClass = ['fv-live-clock', 'fv-live-clock--compact', 'fv-widget--fade', className]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={compactClass} role="group" aria-label="Live clock">
        <div className="fv-live-clock__compact-icon" aria-hidden>
          <ClockIcon />
        </div>
        <div className="fv-live-clock__compact-body">
          <span className="fv-live-clock__compact-time" aria-live="polite" aria-atomic="true">
            {time}
          </span>
          <span className="fv-live-clock__compact-meta">
            {weekday} · {date}
          </span>
        </div>
      </div>
    )
  }

  const rootClass = [
    'fv-widget',
    'fv-live-clock',
    'fv-widget--fade',
    variant === 'landing' ? 'fv-widget--landing' : '',
    variant === 'hero' ? 'fv-live-clock--hero' : variant === 'landing' ? 'fv-live-clock--landing' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} role="group" aria-label="Live clock">
      <div className="fv-live-clock__icon" aria-hidden>
        {variant === 'hero' ? <ClockIcon /> : <CalendarIcon />}
      </div>
      <div className="fv-live-clock__body">
        <div className="fv-live-clock__weekday">{weekday}</div>
        <div className="fv-live-clock__date">{date}</div>
        <div className="fv-live-clock__time" aria-live="polite" aria-atomic="true">
          {time}
        </div>
      </div>
    </div>
  )
}
