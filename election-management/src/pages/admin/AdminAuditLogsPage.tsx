import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { fetchRecentAuditLogs } from '@/services/auditService'
import type { AuditLogEntry } from '@/types/auth'
import { formatRelativeTime } from '@/utils/formatDate'

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<'all' | 'approvals'>('all')

  useEffect(() => {
    void fetchRecentAuditLogs(200)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [])

  const displayed =
    actionFilter === 'approvals'
      ? logs.filter((l) => l.action === 'creator_approved' || l.action === 'creator_rejected')
      : logs

  function downloadCsv() {
    const header = ['time', 'action', 'actor', 'target', 'election', 'details']
    const rows = displayed.map((log) => [
      log.created_at,
      log.action,
      log.actor?.email ?? '',
      log.target?.email ?? '',
      log.election?.title ?? '',
      JSON.stringify(log.details ?? {}),
    ])
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fortressvote-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AdminSidebar pendingCount={0} />
      <main className="lg:pl-[280px]">
        <AdminTopBar title="Audit Trail" />
        <div className="p-margin">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link to="/admin/dashboard" className="font-label-sm text-primary hover:underline">
                ← Back to dashboard
              </Link>
              <h1 className="mt-2 font-headline-lg text-headline-lg text-on-surface">Full Audit Trail</h1>
            </div>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={displayed.length === 0}
              className="rounded-xl bg-primary px-4 py-2 font-label-md text-on-primary disabled:opacity-50"
            >
              Download CSV
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActionFilter('all')}
              className={
                actionFilter === 'all'
                  ? 'rounded-lg bg-primary px-4 py-2 font-label-sm text-on-primary'
                  : 'rounded-lg border border-line px-4 py-2 font-label-sm text-on-surface-variant'
              }
            >
              All activity
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('approvals')}
              className={
                actionFilter === 'approvals'
                  ? 'rounded-lg bg-primary px-4 py-2 font-label-sm text-on-primary'
                  : 'rounded-lg border border-line px-4 py-2 font-label-sm text-on-surface-variant'
              }
            >
              Creator approvals
            </button>
          </div>

          {loading ? (
            <p className="text-on-surface-variant">Loading logs…</p>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-line bg-surface-container">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-high/50 text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayed.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 text-on-surface-variant">{formatRelativeTime(log.created_at)}</td>
                      <td className="px-4 py-3 text-on-surface">{log.action}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{log.actor?.email ?? 'System'}</td>
                      <td className="max-w-md truncate px-4 py-3 text-on-surface-variant">
                        {log.election?.title ?? JSON.stringify(log.details ?? {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

