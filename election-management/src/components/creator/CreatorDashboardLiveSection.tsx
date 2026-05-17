import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Election } from '@/types/election'
import type { CreatorDashboardLivePayload, CreatorLiveElectionRow } from '@/types/creatorDashboardLive'
import { useCreatorDashboardLive } from '@/hooks/useCreatorDashboardLive'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import { electionShortCode } from '@/utils/creatorDisplay'
import { formatTimeRemaining } from '@/utils/electionTime'

const LIVE_ACCENT = ['#10B981', '#3B82F6', '#06B6D4', '#6C3FC5'] as const

function ElectionStatusDonut({
  live,
  labels,
}: {
  live: CreatorDashboardLivePayload
  labels: { active: string; upcoming: string; completed: string }
}) {
  const segments = [
    { value: live.status_active, color: '#10B981', label: labels.active },
    { value: live.status_upcoming, color: '#3B82F6', label: labels.upcoming },
    { value: live.status_completed, color: '#6C3FC5', label: labels.completed },
  ]
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  const r = 35
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="donut-wrap">
      <svg width="90" height="90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        {segments.map((seg) => {
          const len = (seg.value / total) * circumference
          const dash = `${len} ${circumference - len}`
          const el = (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          )
          offset += len
          return el
        })}
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
          fill="#0F172A"
          fontFamily="IBM Plex Mono, monospace"
        >
          {formatDashboardNumber(total)}
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg) => (
          <div key={seg.label} className="legend-item">
            <div className="legend-dot" style={{ background: seg.color }} />
            <span className="legend-label">{seg.label}</span>
            <span className="legend-val">{formatDashboardNumber(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthlyVotesChart({ points }: { points: { label: string; count: number }[] }) {
  const blues = ['#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E3A8A']
  const display =
    points.length > 0
      ? points
      : ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A'].map((label) => ({ label, count: 0 }))
  const max = Math.max(1, ...display.map((p) => p.count))

  return (
    <div className="mini-chart">
      {display.map((p, i) => (
        <div key={`${p.label}-${i}`} className="chart-col">
          <div
            className="chart-bar"
            style={{
              height: `${Math.max(p.count > 0 ? 12 : 4, (p.count / max) * 100)}%`,
              background: blues[i % blues.length],
            }}
          />
          <div className="chart-label">{p.label.charAt(0).toUpperCase()}</div>
        </div>
      ))}
    </div>
  )
}

function LiveElectionRow({
  row,
  index,
  t,
}: {
  row: CreatorLiveElectionRow
  index: number
  t: (key: string, opts?: Record<string, string>) => string
}) {
  const accent = LIVE_ACCENT[index % LIVE_ACCENT.length]
  const denom = row.max_voters > 0 ? row.max_voters : row.registered
  const votedLabel = t('live.voted', {
    cast: formatDashboardNumber(row.ballots_cast),
    total: formatDashboardNumber(denom),
  })

  return (
    <Link
      to={`/creator/elections/${row.election_id}`}
      className="live-election-row"
      style={{ borderLeftColor: accent }}
    >
      <div className="live-election-row-head">
        <div>
          <div className="live-election-row-title">{row.title}</div>
          <div className="live-election-row-meta">
            {electionShortCode(row.election_id)} ·{' '}
            {t('live.endsIn', { time: formatTimeRemaining(row.end_date) })}
          </div>
        </div>
        <span className="badge b-active">
          <span className="b-dot" /> {t('live.statusActive')}
        </span>
      </div>
      <div className="live-election-row-stats">
        <span>{votedLabel}</span>
        <span style={{ fontWeight: 700, color: accent }}>{row.turnout_percent}%</span>
      </div>
      <div className="progress-wrap">
        <div
          className="progress-fill"
          style={{
            width: `${row.turnout_percent}%`,
            background: `linear-gradient(90deg,${accent},${accent}bb)`,
          }}
        />
      </div>
    </Link>
  )
}

interface CreatorDashboardLiveSectionProps {
  creatorId: string | undefined
  elections: Election[]
  enabled: boolean
}

export function CreatorDashboardLiveSection({
  creatorId,
  elections,
  enabled,
}: CreatorDashboardLiveSectionProps) {
  const { t } = useTranslation('creator')
  const { live, loading } = useCreatorDashboardLive(creatorId, elections, enabled)
  const hasLive = live.live_elections.length > 0

  const statusLabels = {
    active: t('live.statusActive'),
    upcoming: t('live.statusUpcoming'),
    completed: t('live.statusCompleted'),
  }

  return (
    <div className="grid-7-3 creator-dashboard-live-grid" style={{ marginBottom: 16 }}>
      <div className="card-elevated">
        <div className="card-header">
          <div>
            <div className="card-title">{t('live.overviewTitle')}</div>
            <div className="card-subtitle">{t('live.overviewSub')}</div>
          </div>
          {hasLive ? (
            <span className="badge b-live">
              <span className="b-dot" /> {t('stats.live')}
            </span>
          ) : null}
        </div>
        <div className="card-body">
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--subtle)' }}>{t('live.loading')}</p>
          ) : hasLive ? (
            <div className="live-election-list">
              {live.live_elections.map((row, i) => (
                <LiveElectionRow key={row.election_id} row={row} index={i} t={t} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--subtle)', marginBottom: 16 }}>
              {t('live.noPolling')}{' '}
              <Link to="/creator/elections">{t('live.viewAllElections')}</Link>.
            </p>
          )}

          <div className="live-monthly-votes">
            <div className="live-monthly-votes-label">{t('live.monthlyVotes')}</div>
            <MonthlyVotesChart points={live.monthly_votes} />
          </div>
        </div>
      </div>

      <div className="creator-dashboard-live-side">
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">{t('live.electionStatus')}</div>
          </div>
          <div className="card-body">
            <ElectionStatusDonut live={live} labels={statusLabels} />
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">{t('live.quickActions')}</div>
          </div>
          <div className="card-body creator-quick-actions">
            <Link to="/creator/elections/new" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('live.createElection')}
            </Link>
            <Link to="/creator/candidates" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              {t('live.addCandidate')}
            </Link>
            <Link to="/creator/results" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              {t('live.viewResults')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
