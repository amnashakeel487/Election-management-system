import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import {
  fetchNotificationLogs,
  fetchNotificationSummary,
  processNotificationMilestones,
} from '@/services/notificationService'
import type { NotificationLogRow, NotificationType } from '@/types/notification'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import { formatRelativeTime, formatSubmissionDate } from '@/utils/formatDate'
import {
  NOTIFICATION_STATUS_LABELS,
  NOTIFICATION_TYPE_LABELS,
  notificationStatusClass,
} from '@/utils/notificationPresentation'

const meta = ADMIN_PAGE_META.notifications

const TYPE_FILTERS: Array<{ value: NotificationType | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'email_verification', label: NOTIFICATION_TYPE_LABELS.email_verification },
  { value: 'creator_approval', label: NOTIFICATION_TYPE_LABELS.creator_approval },
  { value: 'creator_rejection', label: NOTIFICATION_TYPE_LABELS.creator_rejection },
  { value: 'secret_voter_id', label: NOTIFICATION_TYPE_LABELS.secret_voter_id },
  { value: 'election_start', label: NOTIFICATION_TYPE_LABELS.election_start },
  { value: 'election_end', label: NOTIFICATION_TYPE_LABELS.election_end },
  { value: 'winner', label: NOTIFICATION_TYPE_LABELS.winner },
  { value: 'waitlist_joined', label: NOTIFICATION_TYPE_LABELS.waitlist_joined },
  { value: 'waitlist_promoted', label: NOTIFICATION_TYPE_LABELS.waitlist_promoted },
]

const STATUS_FILTERS = [
  { value: 'all' as const, label: 'All statuses' },
  { value: 'sent' as const, label: 'Sent' },
  { value: 'failed' as const, label: 'Failed' },
]

const PAGE_SIZE = 20

export function AdminNotificationsPage() {
  const [summary, setSummary] = useState({ total: 0, sent: 0, failed: 0 })
  const [logs, setLogs] = useState<NotificationLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processMessage, setProcessMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sum, page] = await Promise.all([
        fetchNotificationSummary(30),
        fetchNotificationLogs({
          type: typeFilter,
          status: statusFilter,
          limit: PAGE_SIZE,
          offset,
        }),
      ])
      setSummary({ total: sum.total, sent: sum.sent, failed: sum.failed })
      setLogs(page.logs)
      setTotal(page.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter, offset])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setOffset(0)
  }, [typeFilter, statusFilter])

  async function handleProcessPending() {
    setProcessing(true)
    setProcessMessage(null)
    try {
      const result = await processNotificationMilestones()
      if (result.error) {
        setProcessMessage(result.error)
      } else {
        setProcessMessage('Processed pending election milestones (start, end, winner).')
        await load()
      }
    } catch (err) {
      setProcessMessage(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  const pageStart = total === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + PAGE_SIZE, total)

  return (
    <>
      <AdminPageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void handleProcessPending()}
              disabled={processing || loading}
            >
              {processing ? 'Processing…' : 'Process pending emails'}
            </button>
          </>
        }
      />

      {processMessage ? (
        <p className="mb-4" style={{ fontSize: 12, color: 'var(--subtle)' }}>
          {processMessage}
        </p>
      ) : null}

      {error ? (
        <div className="card-elevated mb-4">
          <div className="card-body" style={{ color: 'var(--danger)' }}>
            {error}
          </div>
        </div>
      ) : null}

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Last 30 days</div>
          <div className="stat-value">{formatDashboardNumber(summary.total)}</div>
          <div className="stat-sub">Total email events logged</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Delivered</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {formatDashboardNumber(summary.sent)}
          </div>
          <div className="stat-sub">Successful sends</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            {formatDashboardNumber(summary.failed)}
          </div>
          <div className="stat-sub">Requires attention</div>
        </div>
      </div>

      <div className="card-elevated">
        <div className="card-header">
          <div className="card-title">Email delivery log</div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
              aria-label="Filter by type"
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'sent' | 'failed')}
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: 16, color: 'var(--subtle)', fontSize: 12 }}>Loading delivery log…</p>
          ) : logs.length === 0 ? (
            <p style={{ padding: 16, color: 'var(--subtle)', fontSize: 12 }}>
              No emails logged yet. Sends appear here after verification, approvals, secret IDs, and election
              milestones.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td>{NOTIFICATION_TYPE_LABELS[row.notification_type]}</td>
                      <td>
                        <div>{row.recipient_email}</div>
                        {row.error_message ? (
                          <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                            {row.error_message}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ maxWidth: 220 }}>{row.subject ?? '—'}</td>
                      <td>
                        <span className={notificationStatusClass(row.status)}>
                          {NOTIFICATION_STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td title={formatSubmissionDate(row.created_at)}>
                        {formatRelativeTime(row.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {total > PAGE_SIZE ? (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--subtle)' }}>
              {pageStart}–{pageEnd} of {total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={offset === 0 || loading}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={offset + PAGE_SIZE >= total || loading}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card-elevated mt-4">
        <div className="card-header">
          <div className="card-title">Notification types</div>
        </div>
        <div className="card-body">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--subtle)', lineHeight: 1.7 }}>
            <li>
              <strong>Email verification</strong> — Supabase Auth link plus optional FortressVote reminder (Brevo).
            </li>
            <li>
              <strong>Creator approval / rejection</strong> — Sent when an admin approves or rejects a creator
              application.
            </li>
            <li>
              <strong>Secret voter ID</strong> — Sent when the voter roll is finalized or a voter requests
              re-send.
            </li>
            <li>
              <strong>Election start / end</strong> — Batch reminders to registered voters; use Process pending or
              schedule the milestone cron.
            </li>
            <li>
              <strong>Winner</strong> — Sent after results are locked (automatic) or via milestone processing.
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
