import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VoteSecureDashboardShell } from '@/components/dashboard/VoteSecureDashboardShell'
import { useAuth } from '@/hooks/useAuth'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import {
  fetchAdminDashboardStats,
  fetchPublishedElections,
  type AdminDashboardStats,
  type ElectionWithCreator,
} from '@/services/adminDashboardService'
import type { AuditLogEntry } from '@/types/auth'
import {
  avatarGradient,
  electionDisplayStatus,
  formatDashboardNumber,
  statusBadgeClass,
  userInitials,
} from '@/utils/dashboardDisplay'
import { formatElectionCode } from '@/utils/electionTime'
import { formatSubmissionDate } from '@/utils/formatDate'

const CHART_HEIGHTS = [38, 55, 42, 70, 85, 60, 95]

function auditIconTone(action: string): 'blue' | 'green' | 'red' | 'yellow' | 'purple' {
  if (action.includes('vote') || action.includes('approve')) return 'green'
  if (action.includes('reject') || action.includes('fail')) return 'red'
  if (action.includes('warn') || action.includes('lock')) return 'yellow'
  if (action.includes('security') || action.includes('encrypt')) return 'purple'
  return 'blue'
}

function AuditLogRow({ log }: { log: AuditLogEntry }) {
  const tone = auditIconTone(log.action)
  return (
    <div className="vs-log-item">
      <div className={`vs-log-icon vs-log-icon--${tone}`}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <div className="vs-log-text">{log.action.replace(/_/g, ' ')}</div>
        <div className="vs-log-time">{formatSubmissionDate(log.created_at)}</div>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const {
    pendingCreators,
    pendingCount,
    auditLogs,
    loading,
    actionError,
    actionNotice,
    actingOnId,
    approve,
    reject,
  } = useAdminApproval(profile?.id)

  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [elections, setElections] = useState<ElectionWithCreator[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([fetchAdminDashboardStats(), fetchPublishedElections()])
      .then(([s, e]) => {
        setStats(s)
        setElections(e)
      })
      .catch((err) => setStatsError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setStatsLoading(false))
  }, [])

  const breakdown = useMemo(() => {
    let active = 0
    let upcoming = 0
    let completed = 0
    for (const e of elections) {
      const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
      if (phase === 'active') active++
      else if (phase === 'upcoming') upcoming++
      else if (phase === 'completed') completed++
    }
    return { active, upcoming, completed, total: elections.length }
  }, [elections])

  const welcomeDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const topbarExtra = (
    <>
      <button type="button" className="vs-tb-btn" aria-label="Notifications">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {pendingCount > 0 ? <span className="vs-tb-notif">{pendingCount}</span> : null}
      </button>
      <button type="button" className="vs-tb-btn" aria-label="Settings">
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </>
  )

  return (
    <VoteSecureDashboardShell
      role="admin"
      pageTitle="Dashboard"
      pageCrumb={`Welcome back, ${profile?.full_name?.trim() || 'Admin'} · ${welcomeDate}`}
      pendingCount={pendingCount}
      electionCount={elections.length}
      topbarExtra={topbarExtra}
    >
      {actionNotice ? <div className="vs-alert vs-alert--success">{actionNotice}</div> : null}
      {actionError || statsError ? (
        <div className="vs-alert vs-alert--error">{actionError ?? statsError}</div>
      ) : null}

      <div className="vs-stat-grid">
        <div className="vs-stat-card vs-stat-card--blue">
          <div className="vs-stat-icon vs-stat-icon--blue">
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" />
            </svg>
          </div>
          <div className="vs-stat-num">{statsLoading ? '—' : stats?.activeElections ?? 0}</div>
          <div className="vs-stat-label">Active Elections</div>
        </div>
        <div className="vs-stat-card vs-stat-card--purple">
          <div className="vs-stat-icon vs-stat-icon--purple">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="vs-stat-num">{statsLoading ? '—' : formatDashboardNumber(stats?.totalUsers ?? 0)}</div>
          <div className="vs-stat-label">Total Users</div>
        </div>
        <div className="vs-stat-card vs-stat-card--green">
          <div className="vs-stat-icon vs-stat-icon--green">
            <svg viewBox="0 0 24 24" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="vs-stat-num">{statsLoading ? '—' : formatDashboardNumber(stats?.totalVotes ?? 0)}</div>
          <div className="vs-stat-label">Votes Cast (Total)</div>
        </div>
        <div className="vs-stat-card vs-stat-card--cyan">
          <div className="vs-stat-icon vs-stat-icon--cyan">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="vs-stat-num">{statsLoading ? '—' : formatDashboardNumber(stats?.verifiedVoters ?? 0)}</div>
          <div className="vs-stat-label">Verified Voters</div>
        </div>
      </div>

      <div className="vs-dash-grid">
        <div className="vs-panel">
          <div className="vs-panel-head">
            <div>
              <div className="vs-panel-title">Active Elections</div>
              <div className="vs-panel-sub">Real-time election status overview</div>
            </div>
            <Link to="/admin/elections" className="vs-panel-action">
              View All
            </Link>
          </div>
          <div className="vs-panel-body vs-panel-body--flush">
            <div className="vs-table-wrap">
              {loading || statsLoading ? (
                <p className="vs-empty">Loading elections…</p>
              ) : elections.length === 0 ? (
                <p className="vs-empty">No published elections yet.</p>
              ) : (
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th>Election</th>
                      <th>Status</th>
                      <th>Window</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elections.slice(0, 6).map((e) => {
                      const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
                      return (
                        <tr key={e.id}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{e.title}</div>
                            <div className="vs-t-mono">{formatElectionCode(e.id)}</div>
                          </td>
                          <td>
                            <span className={`vs-t-badge ${statusBadgeClass(phase)}`}>
                              {phase === 'active' ? <span className="vs-t-pulse" /> : null}
                              {phase}
                            </span>
                          </td>
                          <td className="vs-t-mono">
                            {new Date(e.start_date).toLocaleDateString()} –{' '}
                            {new Date(e.end_date).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="vs-t-actions">
                              <Link to={`/elections/${e.id}`} className="vs-t-btn">
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="vs-dash-col">
          <div className="vs-panel">
            <div className="vs-panel-head">
              <div>
                <div className="vs-panel-title">Creator Requests</div>
                <div className="vs-panel-sub">Pending approvals</div>
              </div>
              <Link to="/admin/approvals" className="vs-panel-action">
                View All
              </Link>
            </div>
            <div className="vs-panel-body">
              {loading ? (
                <p className="vs-empty">Loading…</p>
              ) : pendingCreators.length === 0 ? (
                <p className="vs-empty">No pending creator requests.</p>
              ) : (
                pendingCreators.slice(0, 4).map((req) => (
                  <div key={req.id} className="vs-req-item">
                    <div
                      className="vs-req-avatar"
                      style={{ background: avatarGradient(req.email) }}
                    >
                      {userInitials(req.full_name, req.email)}
                    </div>
                    <div className="vs-req-info">
                      <div className="vs-req-name">{req.full_name ?? req.email}</div>
                      <div className="vs-req-meta">
                        {req.organization?.trim() || 'No organization'} · {formatSubmissionDate(req.created_at)}
                      </div>
                    </div>
                    <div className="vs-req-actions">
                      <button
                        type="button"
                        className="vs-btn-approve"
                        disabled={actingOnId === req.id}
                        onClick={() => void approve(req.id, req.email)}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className="vs-btn-reject"
                        disabled={actingOnId === req.id}
                        onClick={() => void reject(req.id, req.email, 'Does not meet platform requirements')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="vs-panel">
            <div className="vs-panel-head">
              <div>
                <div className="vs-panel-title">Vote Activity</div>
                <div className="vs-panel-sub">Last 7 days (platform)</div>
              </div>
            </div>
            <div className="vs-panel-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="vs-stat-num" style={{ fontSize: 22 }}>
                  {statsLoading ? '—' : formatDashboardNumber(stats?.totalVotes ?? 0)}
                </div>
              </div>
              <div className="vs-chart-bars">
                {CHART_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="vs-chart-bar"
                    style={{
                      height: `${h}%`,
                      background:
                        i >= 4
                          ? 'linear-gradient(180deg,var(--vs-cyan),rgba(6,182,212,0.4))'
                          : 'linear-gradient(180deg,var(--vs-blue),rgba(36,81,163,0.4))',
                    }}
                  />
                ))}
              </div>
              <div className="vs-chart-labels">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
                  <div key={i} className="vs-chart-lbl">
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="vs-dash-grid-3">
        <div className="vs-panel">
          <div className="vs-panel-head">
            <div className="vs-panel-title">Election Breakdown</div>
          </div>
          <div className="vs-panel-body">
            <div className="vs-donut-wrap">
              <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden>
                <circle cx="45" cy="45" r="35" fill="none" stroke="#F0F4F9" strokeWidth="12" />
                <text x="45" y="41" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0F172A">
                  {breakdown.total}
                </text>
                <text x="45" y="54" textAnchor="middle" fontSize="7" fill="#94A3B8">
                  Total
                </text>
              </svg>
              <div>
                <div className="vs-legend-item">
                  <span className="vs-legend-dot" style={{ background: '#10B981' }} />
                  <span className="vs-legend-label">Active</span>
                  <span className="vs-legend-val">{breakdown.active}</span>
                </div>
                <div className="vs-legend-item">
                  <span className="vs-legend-dot" style={{ background: '#2451A3' }} />
                  <span className="vs-legend-label">Upcoming</span>
                  <span className="vs-legend-val">{breakdown.upcoming}</span>
                </div>
                <div className="vs-legend-item">
                  <span className="vs-legend-dot" style={{ background: '#6C3FC5' }} />
                  <span className="vs-legend-label">Completed</span>
                  <span className="vs-legend-val">{breakdown.completed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="vs-panel">
          <div className="vs-panel-head">
            <div>
              <div className="vs-panel-title">Security Center</div>
              <div className="vs-panel-sub">Platform checks</div>
            </div>
          </div>
          <div className="vs-panel-body">
            <div className="vs-sec-item">
              <span className="vs-sec-badge vs-sec-badge--ok">OK</span>
              <span className="vs-sec-text">Authenticated admin session active</span>
              <span className="vs-sec-time">Now</span>
            </div>
            <div className="vs-sec-item">
              <span className="vs-sec-badge vs-sec-badge--ok">OK</span>
              <span className="vs-sec-text">Row-level security enabled on ballots</span>
              <span className="vs-sec-time">Live</span>
            </div>
            <div className="vs-sec-item">
              <span className="vs-sec-badge vs-sec-badge--warn">WARN</span>
              <span className="vs-sec-text">{pendingCount} creator request(s) awaiting review</span>
              <span className="vs-sec-time">Queue</span>
            </div>
          </div>
        </div>

        <div className="vs-panel">
          <div className="vs-panel-head">
            <div>
              <div className="vs-panel-title">Audit Log</div>
              <div className="vs-panel-sub">Recent system activity</div>
            </div>
            <Link to="/admin/audit-logs" className="vs-panel-action">
              View All
            </Link>
          </div>
          <div className="vs-panel-body">
            {auditLogs.length === 0 ? (
              <p className="vs-empty">No recent audit entries.</p>
            ) : (
              auditLogs.slice(0, 5).map((log) => <AuditLogRow key={log.id} log={log} />)
            )}
          </div>
        </div>
      </div>
    </VoteSecureDashboardShell>
  )
}
