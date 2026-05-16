import { useState } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { useAuditTransparency } from '@/hooks/useAuditTransparency'
import { downloadAuditCsv, fetchFilteredAuditLogs } from '@/services/auditService'
import { AUDIT_CATEGORIES, type AuditCategory } from '@/types/audit'
import { AUDIT_CATEGORY_LABELS } from '@/utils/auditPresentation'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'
import { getAuditPresentation, isAdminOverrideLog } from '@/utils/auditPresentation'

const meta = ADMIN_PAGE_META.audit
const RANGE_OPTIONS = [7, 30, 90] as const

export function AdminAuditLogsPage() {
  const {
    summary,
    logs,
    total,
    loading,
    error,
    category,
    overrideOnly,
    rangeDays,
    offset,
    pageSize,
    setCategoryFilter,
    toggleOverrideOnly,
    changeRange,
    nextPage,
    prevPage,
    refresh,
  } = useAuditTransparency()

  const [exporting, setExporting] = useState(false)

  async function downloadAllCsv() {
    setExporting(true)
    try {
      const since = new Date()
      since.setDate(since.getDate() - (rangeDays - 1))
      since.setHours(0, 0, 0, 0)
      const page = await fetchFilteredAuditLogs({
        category,
        overrideOnly,
        from: since.toISOString(),
        limit: 500,
        offset: 0,
      })
      downloadAuditCsv(page.logs, 'fortressvote-transparency')
    } finally {
      setExporting(false)
    }
  }

  const pageStart = total === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + pageSize, total)

  return (
    <>
      <AdminPageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => refresh()} disabled={loading}>
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void downloadAllCsv()}
              disabled={exporting || loading}
            >
              {exporting ? 'Exporting…' : 'Download CSV'}
            </button>
          </>
        }
      />

      {error ? (
        <div className="alert alert-danger">
          {error}
          <p style={{ marginTop: 8, fontSize: 11 }}>
            Apply migration <code>019_audit_transparency_module.sql</code> in Supabase if RPCs are missing.
          </p>
        </div>
      ) : null}

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[
          { label: 'Events (range)', value: summary?.total_in_range ?? 0 },
          { label: 'Last 24h', value: summary?.total_24h ?? 0 },
          { label: 'Logins', value: summary?.logins ?? 0 },
          { label: 'Votes', value: summary?.votes ?? 0 },
          { label: 'Overrides', value: summary?.overrides ?? 0 },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-num">{loading ? '—' : formatDashboardNumber(s.value)}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card-elevated" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Filters</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {RANGE_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                className={`btn btn-ghost btn-xs${rangeDays === days ? ' active' : ''}`}
                onClick={() => changeRange(days)}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {AUDIT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`tab-btn${category === cat && !overrideOnly ? ' active' : ''}`}
                style={{ padding: '5px 12px' }}
                onClick={() => setCategoryFilter(cat as AuditCategory)}
              >
                {AUDIT_CATEGORY_LABELS[cat]}
              </button>
            ))}
            <button
              type="button"
              className={`tab-btn${overrideOnly ? ' active' : ''}`}
              style={{ padding: '5px 12px' }}
              onClick={toggleOverrideOnly}
            >
              Overrides only
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>Actor</th>
                  <th>Context</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                      Loading audit logs…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                      No events match these filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const item = getAuditPresentation(log)
                    const override = isAdminOverrideLog(log)
                    return (
                      <tr key={log.id} style={override ? { background: '#FFFBEB' } : undefined}>
                        <td className="mono">{formatSubmissionDate(log.created_at)}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--subtle)' }}>{log.action}</div>
                        </td>
                        <td className="muted">{log.actor?.email ?? 'System'}</td>
                        <td className="muted">{log.election?.title ?? log.target?.email ?? '—'}</td>
                        <td className="muted" style={{ maxWidth: 240 }}>
                          {item.description}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {total > pageSize ? (
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: 'var(--subtle)',
              }}
            >
              <span>
                Showing {pageStart}–{pageEnd} of {total}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" disabled={offset === 0 || loading} onClick={prevPage}>
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={offset + pageSize >= total || loading}
                  onClick={nextPage}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
