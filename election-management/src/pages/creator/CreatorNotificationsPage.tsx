import { useCallback, useEffect, useState } from 'react'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { fetchNotificationLogs, fetchNotificationSummary } from '@/services/notificationService'
import type { NotificationLogRow } from '@/types/notification'
import { formatRelativeTime, formatSubmissionDate } from '@/utils/formatDate'
import { NOTIFICATION_STATUS_LABELS, NOTIFICATION_TYPE_LABELS, notificationStatusClass } from '@/utils/notificationPresentation'

const meta = CREATOR_PAGE_META.notifications

export function CreatorNotificationsPage() {
  const [summary, setSummary] = useState({ total: 0, sent: 0, failed: 0 })
  const [logs, setLogs] = useState<NotificationLogRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sum, page] = await Promise.all([fetchNotificationSummary(30), fetchNotificationLogs({ limit: 25 })])
      setSummary(sum)
      setLogs(page.logs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-num">{summary.total}</div>
          <div className="stat-label">Last 30 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{summary.sent}</div>
          <div className="stat-label">Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{summary.failed}</div>
          <div className="stat-label">Failed</div>
        </div>
      </div>

      <div className="card-elevated">
        <div className="card-header">
          <div className="card-title">Recent notifications</div>
        </div>
        <div className="card-body">
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Loading…</p>
          ) : logs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--subtle)' }}>No notification logs yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="notif-item">
                <div
                  className="notif-icon"
                  style={{
                    background: log.status === 'sent' ? '#DCFCE7' : '#FEE2E2',
                    color: log.status === 'sent' ? '#16A34A' : '#DC2626',
                  }}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
                    <path d="M4 4h16v12H4z" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="notif-title">{NOTIFICATION_TYPE_LABELS[log.notification_type] ?? log.notification_type}</div>
                  <div className="notif-sub">{log.recipient_email ?? log.error_message ?? '—'}</div>
                  <span className={`badge ${notificationStatusClass(log.status)}`} style={{ marginTop: 6 }}>
                    {NOTIFICATION_STATUS_LABELS[log.status]}
                  </span>
                </div>
                <div className="notif-time" title={formatSubmissionDate(log.created_at)}>
                  {formatRelativeTime(log.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
