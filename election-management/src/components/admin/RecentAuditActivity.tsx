import { Link } from 'react-router-dom'
import type { AuditLogEntry } from '@/types/auth'
import { formatRelativeTime } from '@/utils/formatDate'

interface RecentAuditActivityProps {
  logs: AuditLogEntry[]
}

function getAuditPresentation(log: AuditLogEntry) {
  const actorEmail = (log.actor as { email?: string } | null)?.email ?? 'System'
  const targetEmail =
    (log.target as { email?: string } | null)?.email ??
    (log.details?.target_email as string | undefined)
  const electionTitle =
    (log.election as { title?: string } | null)?.title ??
    (log.details?.title as string | undefined)
  const details = log.details ?? {}

  switch (log.action) {
    case 'user_login':
      return {
        icon: 'login',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        title: 'User Login',
        description: `${actorEmail} signed in.`,
      }
    case 'vote_cast':
      return {
        icon: 'how_to_vote',
        iconBg: 'bg-tertiary/20',
        iconColor: 'text-tertiary',
        title: 'Vote Cast',
        description: `${actorEmail} voted in ${electionTitle ?? 'an election'}${details.candidate_name ? ` (${details.candidate_name as string})` : ''}.`,
      }
    case 'election_created':
      return {
        icon: 'add_circle',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        title: 'Election Created',
        description: `${actorEmail} created "${electionTitle ?? (details.title as string) ?? 'election'}".`,
      }
    case 'election_published':
      return {
        icon: 'publish',
        iconBg: 'bg-tertiary/20',
        iconColor: 'text-tertiary',
        title: 'Election Published',
        description: `${electionTitle ?? (details.title as string) ?? 'Election'} is now open for registration.`,
      }
    case 'election_updated':
      return {
        icon: 'edit_note',
        iconBg: 'bg-surface-container-high',
        iconColor: 'text-on-surface-variant',
        title: 'Election Updated',
        description: `${actorEmail} updated ${electionTitle ?? 'an election'} (${(details.old_status as string) ?? '?'} → ${(details.new_status as string) ?? '?'}).`,
      }
    case 'election_voter_roll_finalized':
      return {
        icon: 'badge',
        iconBg: 'bg-secondary/20',
        iconColor: 'text-secondary',
        title: 'Voter Roll Finalized',
        description: `Secret IDs issued for ${electionTitle ?? 'election'}.`,
      }
    case 'creator_approved':
      return {
        icon: 'verified',
        iconBg: 'bg-tertiary',
        iconColor: 'text-tertiary-fixed',
        title: 'Creator Approved',
        description: `${targetEmail ?? 'User'} granted election creator access.`,
      }
    case 'creator_rejected':
      return {
        icon: 'report',
        iconBg: 'bg-error',
        iconColor: 'text-on-error',
        title: 'Creator Rejected',
        description: `${targetEmail ?? 'User'} application was rejected.`,
      }
    default:
      return {
        icon: 'settings',
        iconBg: 'bg-on-surface-variant',
        iconColor: 'text-surface',
        title: log.action.replace(/_/g, ' '),
        description: electionTitle ? `${electionTitle}` : JSON.stringify(details),
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
      <Link
        to="/admin/audit-logs"
        className="mt-8 block w-full rounded-xl border border-white/10 py-3 text-center font-label-md text-label-md text-on-surface-variant transition-all hover:bg-surface-container-high"
      >
        Full Audit Trail
      </Link>
    </div>
  )
}
