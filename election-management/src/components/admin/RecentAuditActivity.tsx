import { Link } from 'react-router-dom'
import type { AuditLogEntry } from '@/types/auth'
import { getAuditPresentation } from '@/utils/auditPresentation'
import { formatRelativeTime } from '@/utils/formatDate'

interface RecentAuditActivityProps {
  logs: AuditLogEntry[]
}

export function RecentAuditActivity({ logs }: RecentAuditActivityProps) {
  return (
    <div className="col-span-12 rounded-[24px] border border-line bg-surface-container p-lg lg:col-span-4">
      <h3 className="mb-6 font-headline-md text-headline-md text-on-surface">Recent Activity</h3>
      <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[1px] before:bg-elevated/50">
        {logs.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">No audit activity yet.</p>
        ) : (
          logs.map((log) => {
            const item = getAuditPresentation(log)
            return (
              <div key={log.id} className="relative pl-8">
                <div
                  className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full ${item.iconBg}`}
                >
                  <span className={`material-symbols-outlined text-[14px] ${item.iconColor}`}>{item.icon}</span>
                </div>
                <p className="font-label-md text-label-md text-on-surface">{item.title}</p>
                <p className="text-[11px] text-on-surface-variant">{item.description}</p>
                <span className="mt-1 block text-[10px] uppercase text-on-surface-variant">
                  {formatRelativeTime(log.created_at)}
                </span>
              </div>
            )
          })
        )}
      </div>
      <Link
        to="/admin/audit-logs"
        className="mt-8 block w-full rounded-xl border border-line py-3 text-center font-label-md text-label-md text-on-surface-variant transition-all hover:bg-surface-container-high"
      >
        Transparency dashboard
      </Link>
    </div>
  )
}
