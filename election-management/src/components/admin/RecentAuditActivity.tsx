import type { AuditLogEntry } from '@/types/auth'
import { formatRelativeTime } from '@/utils/formatDate'

interface RecentAuditActivityProps {
  logs: AuditLogEntry[]
}

function getAuditPresentation(log: AuditLogEntry) {
  const targetEmail =
    (log.target as { email?: string } | null)?.email ??
    (log.details?.target_email as string | undefined) ??
    'Unknown user'

  switch (log.action) {
    case 'creator_approved':
      return {
        icon: 'verified',
        iconBg: 'bg-tertiary',
        iconColor: 'text-tertiary-fixed',
        title: 'Creator Approved',
        description: `${targetEmail} granted election creator access.`,
      }
    case 'creator_rejected':
      return {
        icon: 'report',
        iconBg: 'bg-error',
        iconColor: 'text-on-error',
        title: 'Creator Rejected',
        description: `${targetEmail} application was rejected.`,
      }
    default:
      return {
        icon: 'settings',
        iconBg: 'bg-on-surface-variant',
        iconColor: 'text-surface',
        title: log.action,
        description: JSON.stringify(log.details ?? {}),
      }
  }
}

export function RecentAuditActivity({ logs }: RecentAuditActivityProps) {
  return (
    <div className="col-span-12 rounded-[24px] border border-white/5 bg-surface-container p-lg lg:col-span-4">
      <h3 className="mb-6 font-headline-md text-headline-md text-on-surface">Recent Activity</h3>
      <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[1px] before:bg-white/10">
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
      <button
        type="button"
        className="mt-8 w-full rounded-xl border border-white/10 py-3 font-label-md text-label-md text-on-surface-variant transition-all hover:bg-surface-container-high"
      >
        Full Audit Trail
      </button>
    </div>
  )
}
