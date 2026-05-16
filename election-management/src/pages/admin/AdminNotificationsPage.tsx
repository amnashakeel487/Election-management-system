import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import { useAuth } from '@/hooks/useAuth'
import { fetchRecentAuditLogs } from '@/services/auditService'
import type { AuditLogEntry } from '@/types/auth'
import { getAuditPresentation } from '@/utils/auditPresentation'
import { formatRelativeTime } from '@/utils/formatDate'

const meta = ADMIN_PAGE_META.notifications

type NotifTab = 'all' | 'alerts' | 'system'

export function AdminNotificationsPage() {
  const { profile } = useAuth()
  const { pendingCount } = useAdminApproval(profile?.id)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<NotifTab>('all')

  useEffect(() => {
    void fetchRecentAuditLogs(30)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [])

  const items = useMemo(() => {
    const list: { id: string; title: string; sub: string; time: string; unread: boolean }[] = []
    if (pendingCount > 0) {
      list.push({
        id: 'pending-creators',
        title: `${pendingCount} creator request(s) pending`,
        sub: 'Review applications in Creator Requests',
        time: 'Now',
        unread: true,
      })
    }
    for (const log of logs) {
      const pres = getAuditPresentation(log)
      const isAlert = log.action.includes('reject') || log.action.includes('fail')
      if (tab === 'alerts' && !isAlert) continue
      if (tab === 'system' && isAlert) continue
      list.push({
        id: log.id,
        title: pres.title,
        sub: pres.description,
        time: formatRelativeTime(log.created_at),
        unread: false,
      })
    }
    return list
  }, [logs, pendingCount, tab])

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <div className="tabs">
        <button type="button" className={`tab-btn${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>
          All
        </button>
        <button type="button" className={`tab-btn${tab === 'alerts' ? ' active' : ''}`} onClick={() => setTab('alerts')}>
          Alerts
        </button>
        <button type="button" className={`tab-btn${tab === 'system' ? ' active' : ''}`} onClick={() => setTab('system')}>
          System
        </button>
      </div>

      <div className="card-elevated">
        <div className="card-header">
          <div className="card-title">Inbox</div>
          {pendingCount > 0 ? (
            <Link to="/admin/requests" className="btn btn-warning btn-sm">
              {pendingCount} pending
            </Link>
          ) : null}
        </div>
        <div className="card-body">
          {loading ? (
            <p style={{ color: 'var(--subtle)', fontSize: 12 }}>Loading notifications…</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--subtle)', fontSize: 12 }}>No notifications in this view.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="notif-item">
                {item.unread ? <span className="notif-unread" aria-hidden /> : null}
                <div className="notif-icon" style={{ background: '#EFF4FF', color: '#2451A3' }}>
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" strokeWidth="2" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="notif-title">{item.title}</div>
                  <div className="notif-sub">{item.sub}</div>
                </div>
                <div className="notif-time">{item.time}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
