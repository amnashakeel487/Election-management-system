import type { AuditLogEntry } from '@/types/auth'
import { getAuditPresentation, isAdminOverrideLog } from '@/utils/auditPresentation'
import { formatSubmissionDate } from '@/utils/formatDate'

interface AuditLogsTableProps {
  logs: AuditLogEntry[]
  loading?: boolean
}

export function AuditLogsTable({ logs, loading }: AuditLogsTableProps) {
  if (loading && logs.length === 0) {
    return <p className="text-on-surface-variant">Loading audit logs…</p>
  }

  if (logs.length === 0) {
    return (
      <p className="rounded-[24px] border border-line bg-surface-container px-6 py-12 text-center text-on-surface-variant">
        No events match these filters.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-surface-container">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-container-high/50 text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-label-sm">Timestamp</th>
              <th className="px-4 py-3 font-label-sm">Event</th>
              <th className="px-4 py-3 font-label-sm">Actor</th>
              <th className="px-4 py-3 font-label-sm">Context</th>
              <th className="px-4 py-3 font-label-sm">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((log) => {
              const item = getAuditPresentation(log)
              const override = isAdminOverrideLog(log)
              return (
                <tr key={log.id} className={override ? 'bg-amber-500/5' : undefined}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-on-surface-variant">
                    {formatSubmissionDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-on-surface">{item.title}</span>
                      {override ? (
                        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                          Override
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[11px] text-on-surface-variant">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{log.actor?.email ?? 'System'}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {log.election?.title ?? log.target?.email ?? '—'}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-on-surface-variant">
                    <span className="line-clamp-2">{item.description}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
