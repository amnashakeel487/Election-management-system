import { DailyQuote } from '@/components/common/DailyQuote'
import { LiveClock } from '@/components/common/LiveClock'

export interface DashboardWidgetsRowProps {
  /** Landing page uses wider layout and light strip background */
  variant?: 'landing' | 'dashboard'
}

export function DashboardWidgetsRow({ variant = 'dashboard' }: DashboardWidgetsRowProps) {
  if (variant === 'landing') {
    return (
      <section className="lp-widgets-row" aria-label="Daily inspiration">
        <div className="lp-widgets-inner lp-widgets-inner--quote-only">
          <DailyQuote variant="landing" />
        </div>
      </section>
    )
  }

  return (
    <div className="fv-dashboard-widgets" aria-label="Live time and daily inspiration">
      <LiveClock />
      <DailyQuote />
    </div>
  )
}
