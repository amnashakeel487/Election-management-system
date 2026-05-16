import { useState } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { downloadAuditCsv, fetchFilteredAuditLogs } from '@/services/auditService'
import { fetchAdminElections, fetchAdminUsers } from '@/services/adminDashboardService'

const meta = ADMIN_PAGE_META.reports

function downloadTextFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function usersToCsv(
  users: Awaited<ReturnType<typeof fetchAdminUsers>>,
): string {
  const header = ['id', 'email', 'full_name', 'role', 'approval_status', 'created_at']
  const rows = users.map((u) => [
    u.id,
    u.email,
    u.full_name ?? '',
    u.role,
    u.approval_status ?? '',
    u.created_at,
  ])
  return [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export function AdminReportsPage() {
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function exportUsers() {
    setBusy('users')
    setMessage(null)
    try {
      const users = await fetchAdminUsers()
      downloadTextFile(usersToCsv(users), `fortressvote-users-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
      setMessage(`Exported ${users.length} users.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  async function exportAudit() {
    setBusy('audit')
    setMessage(null)
    try {
      const since = new Date()
      since.setDate(since.getDate() - 29)
      since.setHours(0, 0, 0, 0)
      const page = await fetchFilteredAuditLogs({ from: since.toISOString(), limit: 500, offset: 0 })
      downloadAuditCsv(page.logs, 'fortressvote-audit')
      setMessage(`Exported ${page.logs.length} audit events.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  async function exportElectionsJson() {
    setBusy('elections')
    setMessage(null)
    try {
      const elections = await fetchAdminElections()
      downloadTextFile(
        JSON.stringify(elections, null, 2),
        `fortressvote-elections-${new Date().toISOString().slice(0, 10)}.json`,
        'application/json',
      )
      setMessage(`Exported ${elections.length} elections as JSON.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      {message ? <div className="alert alert-info">{message}</div> : null}

      <div className="grid-3">
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Users CSV</div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 14 }}>
              Download all platform users with roles and approval status.
            </p>
            <button type="button" className="btn btn-primary" disabled={busy != null} onClick={() => void exportUsers()}>
              {busy === 'users' ? 'Exporting…' : 'Export users CSV'}
            </button>
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Audit trail CSV</div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 14 }}>
              Last 30 days of audit events via transparency filters.
            </p>
            <button type="button" className="btn btn-primary" disabled={busy != null} onClick={() => void exportAudit()}>
              {busy === 'audit' ? 'Exporting…' : 'Download audit CSV'}
            </button>
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Elections JSON</div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 14 }}>
              Full election records including creator metadata.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy != null}
              onClick={() => void exportElectionsJson()}
            >
              {busy === 'elections' ? 'Exporting…' : 'Export elections JSON'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
