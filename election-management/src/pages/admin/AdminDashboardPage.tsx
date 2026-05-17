import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { DashboardWidgetsRow } from '@/components/common/DashboardWidgetsRow'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchAdminExtendedStats,
  fetchVoteActivity,
  type AdminExtendedStats,
  type VoteActivityPoint,
} from '@/services/adminDashboardService'
import type { AuditLogEntry } from '@/types/auth'
import { shortRequestCode } from '@/utils/adminDisplay'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import { formatRelativeTime } from '@/utils/formatDate'
import { getAuditPresentation } from '@/utils/auditPresentation'

const meta = ADMIN_PAGE_META.dashboard

function tlDotStyle(action: string): { bg: string; inner: string } {
  if (action.includes('vote') || action.includes('approve')) return { bg: '#DCFCE7', inner: '#10B981' }
  if (action.includes('reject') || action.includes('fail')) return { bg: '#FEF2F2', inner: '#EF4444' }
  if (action.includes('creator') || action.includes('signup')) return { bg: '#FEF9C3', inner: '#CA8A04' }
  if (action.includes('login')) return { bg: '#EFF4FF', inner: '#2451A3' }
  return { bg: '#F5F3FF', inner: '#6C3FC5' }
}

function RoleDonut({ voters, creators, admins }: { voters: number; creators: number; admins: number }) {
  const total = voters + creators + admins || 1
  const r = 35
  const circumference = 2 * Math.PI * r
  const segments = [
    { value: voters, color: '#1B3A6B', label: 'Voters' },
    { value: creators, color: '#6C3FC5', label: 'Creators' },
    { value: admins, color: '#06B6D4', label: 'Admins' },
  ]
  let offset = 0

  return (
    <div className="donut-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        {segments.map((seg) => {
          const len = (seg.value / total) * circumference
          const dash = `${len} ${circumference - len}`
          const circle = (
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
          return circle
        })}
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="11"
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
            <span className="legend-val" style={{ marginLeft: 12 }}>
              {formatDashboardNumber(seg.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VoteActivityMiniChart({ points }: { points: VoteActivityPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count))
  const total = points.reduce((s, p) => s + p.count, 0)
  const blues = ['#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8']

  return (
    <>
      <div className="mini-chart">
        {points.map((p, i) => (
          <div key={p.label} className="chart-col">
            <div
              className="chart-bar"
              style={{
                height: `${Math.max(8, (p.count / max) * 100)}%`,
                background: blues[i % blues.length],
              }}
            />
            <div className="chart-label">{p.label}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--subtle)' }}>
          Total (7 days):{' '}
          <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace" }}>
            {formatDashboardNumber(total)}
          </span>
        </div>
      </div>
    </>
  )
}

function TimelineItem({ log }: { log: AuditLogEntry }) {
  const pres = getAuditPresentation(log)
  const dot = tlDotStyle(log.action)
  return (
    <div className="tl-item">
      <div className="tl-dot" style={{ background: dot.bg }}>
        <div className="tl-dot-inner" style={{ background: dot.inner }} />
      </div>
      <div className="tl-title">{pres.title}</div>
      <div className="tl-sub">{pres.description}</div>
      <div className="tl-time">{formatRelativeTime(log.created_at)}</div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const {
    pendingCreators,
    auditLogs,
    loading: approvalLoading,
    actionError,
    actionNotice,
    actingOnId,
    approve,
    reject,
  } = useAdminApproval(profile?.id)

  const [stats, setStats] = useState<AdminExtendedStats | null>(null)
  const [voteActivity, setVoteActivity] = useState<VoteActivityPoint[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([fetchAdminExtendedStats(), fetchVoteActivity(7)])
      .then(([extended, activity]) => {
        setStats(extended)
        setVoteActivity(activity)
      })
      .catch((err) => setStatsError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setStatsLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, iconBg: '#EFF4FF', iconColor: '#2451A3' },
    { label: 'Election Creators', value: stats?.creators ?? 0, iconBg: '#F5F3FF', iconColor: '#6C3FC5' },
    { label: 'Registered Voters', value: stats?.voters ?? 0, iconBg: '#ECFDF5', iconColor: '#10B981' },
    { label: 'Total Elections', value: stats?.totalElections ?? 0, iconBg: '#EFF6FF', iconColor: '#3B82F6' },
    { label: 'Active Elections', value: stats?.activeElections ?? 0, iconBg: '#DCFCE7', iconColor: '#16A34A' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, iconBg: '#FEF9C3', iconColor: '#CA8A04' },
    { label: 'Votes Cast (All Time)', value: stats?.totalVotes ?? 0, iconBg: '#ECFDF5', iconColor: '#10B981' },
    { label: 'Security Alerts', value: 0, iconBg: '#FEF2F2', iconColor: '#EF4444' },
  ]

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <DashboardWidgetsRow />

      {actionNotice ? <div className="alert alert-success">{actionNotice}</div> : null}
      {actionError || statsError ? (
        <div className="alert alert-danger">{actionError ?? statsError}</div>
      ) : null}

      <div className="stat-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-icon-row">
              <div className="stat-icon" style={{ background: card.iconBg, color: card.iconColor }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
            </div>
            <div className="stat-num">
              {statsLoading ? '—' : formatDashboardNumber(card.value)}
            </div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-7-3" style={{ marginBottom: 16 }}>
        <div className="card-elevated">
          <div className="card-header">
            <div>
              <div className="card-title">Vote Analytics</div>
              <div className="card-subtitle">Daily votes cast (last 7 days)</div>
            </div>
            <span className="badge badge-live">
              <span className="badge-dot" />
              Live
            </span>
          </div>
          <div className="card-body">
            {statsLoading ? (
              <p style={{ color: 'var(--subtle)', fontSize: 12 }}>Loading chart…</p>
            ) : (
              <VoteActivityMiniChart points={voteActivity} />
            )}
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">User Distribution</div>
          </div>
          <div className="card-body">
            {statsLoading || !stats ? (
              <p style={{ color: 'var(--subtle)', fontSize: 12 }}>Loading…</p>
            ) : (
              <RoleDonut voters={stats.voters} creators={stats.creators} admins={stats.admins} />
            )}
          </div>
        </div>
      </div>

      <div className="grid-7-3">
        <div className="card-elevated">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest system events</div>
            </div>
            <Link to="/admin/audit-logs" className="btn btn-ghost btn-sm">
              View all
            </Link>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div className="timeline">
              {approvalLoading ? (
                <p style={{ color: 'var(--subtle)', fontSize: 12 }}>Loading activity…</p>
              ) : auditLogs.length === 0 ? (
                <p style={{ color: 'var(--subtle)', fontSize: 12 }}>No recent audit entries.</p>
              ) : (
                auditLogs.slice(0, 6).map((log) => <TimelineItem key={log.id} log={log} />)
              )}
            </div>
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Pending Requests</div>
            <Link to="/admin/requests" className="btn btn-ghost btn-sm">
              Manage
            </Link>
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {approvalLoading ? (
                <p style={{ color: 'var(--subtle)', fontSize: 12 }}>Loading…</p>
              ) : pendingCreators.length === 0 ? (
                <p style={{ color: 'var(--subtle)', fontSize: 12 }}>No pending creator requests.</p>
              ) : (
                pendingCreators.slice(0, 4).map((req, idx) => (
                  <div
                    key={req.id}
                    style={{
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                      {shortRequestCode(req.id, idx)}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                      {req.full_name ?? req.email}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--subtle)', marginBottom: 8 }}>
                      {req.organization?.trim() || 'No organization'} · {formatRelativeTime(req.created_at)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Link to="/admin/requests" className="btn btn-ghost btn-xs">
                        Review
                      </Link>
                      <button
                        type="button"
                        className="btn btn-success btn-xs"
                        disabled={actingOnId === req.id}
                        onClick={() => void approve(req.id, req.email)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        disabled={actingOnId === req.id}
                        onClick={() =>
                          void reject(req.id, req.email, 'Does not meet platform requirements')
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
