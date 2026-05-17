import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import type { CreatorDashboardStats } from '@/types/creatorDashboard'

function formatDeltaCount(n: number): string {
  if (n <= 0) return ''
  return `+${formatDashboardNumber(n)}`
}

function formatDeltaPercent(participants: number, registrations7d: number): string {
  if (registrations7d <= 0 || participants <= 0) return ''
  const pct = Math.round((registrations7d / Math.max(1, participants - registrations7d)) * 100)
  if (pct <= 0) return ''
  return `+${pct}%`
}

interface StatCardProps {
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  value: string
  label: string
  badge?: { text: string; className: string } | null
  loading?: boolean
}

function StatCard({ iconBg, iconColor, icon, value, label, badge, loading }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon-row">
        <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        {badge ? <span className={`stat-delta ${badge.className}`}>{badge.text}</span> : null}
      </div>
      <div className="stat-num">{loading ? '—' : value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

interface CreatorDashboardStatsGridProps {
  stats: CreatorDashboardStats
  loading?: boolean
}

export function CreatorDashboardStatsGrid({ stats, loading }: CreatorDashboardStatsGridProps) {
  const electionsBadge =
    stats.elections_created_30d > 0
      ? { text: `+${stats.elections_created_30d}`, className: 'du' }
      : null

  const activeBadge =
    stats.active_elections > 0 ? { text: 'Live', className: 'du' } : null

  const participantsBadgeText = formatDeltaPercent(stats.total_participants, stats.registrations_7d)
  const participantsBadge = participantsBadgeText
    ? { text: participantsBadgeText, className: 'du' }
    : stats.registrations_7d > 0
      ? { text: `+${formatDashboardNumber(stats.registrations_7d)}`, className: 'du' }
      : null

  const votesBadgeText = formatDeltaCount(stats.votes_24h)
  const votesBadge = votesBadgeText ? { text: votesBadgeText, className: 'du' } : null

  const waitlistBadge =
    stats.waitlist_count > 0
      ? { text: 'Waiting', className: 'dn' }
      : null

  return (
    <div className="stat-grid creator-dashboard-stats-grid">
      <StatCard
        loading={loading}
        iconBg="#EFF4FF"
        iconColor="#2451A3"
        value={formatDashboardNumber(stats.total_elections)}
        label="Total Elections"
        badge={electionsBadge}
        icon={
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        }
      />
      <StatCard
        loading={loading}
        iconBg="#DCFCE7"
        iconColor="#16A34A"
        value={formatDashboardNumber(stats.active_elections)}
        label="Active Elections"
        badge={activeBadge}
        icon={
          <svg viewBox="0 0 24 24" aria-hidden>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
      />
      <StatCard
        loading={loading}
        iconBg="#F5F3FF"
        iconColor="#6C3FC5"
        value={formatDashboardNumber(stats.total_participants)}
        label="Total Participants"
        badge={participantsBadge}
        icon={
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        }
      />
      <StatCard
        loading={loading}
        iconBg="#ECFEFF"
        iconColor="#06B6D4"
        value={formatDashboardNumber(stats.total_votes)}
        label="Total Votes Cast"
        badge={votesBadge}
        icon={
          <svg viewBox="0 0 24 24" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        }
      />
      <StatCard
        loading={loading}
        iconBg="#FEF9C3"
        iconColor="#CA8A04"
        value={formatDashboardNumber(stats.waitlist_count)}
        label="On Waitlist"
        badge={waitlistBadge}
        icon={
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
          </svg>
        }
      />
      <StatCard
        loading={loading}
        iconBg="#ECFDF5"
        iconColor="#10B981"
        value={loading ? '—' : `${stats.avg_turnout_percent}%`}
        label="Avg Turnout"
        badge={null}
        icon={
          <svg viewBox="0 0 24 24" aria-hidden>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          </svg>
        }
      />
    </div>
  )
}
