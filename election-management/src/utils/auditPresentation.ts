import type { AuditLogEntry } from '@/types/auth'
import type { AuditCategory } from '@/types/audit'

export interface AuditPresentation {
  icon: string
  iconBg: string
  iconColor: string
  title: string
  description: string
  category: AuditCategory | 'other'
  isOverride: boolean
}

export function auditLogCategory(action: string, details: Record<string, unknown> | null): AuditCategory | 'other' {
  if (action === 'user_login' || action === 'user_logout' || action === 'user_signup') return 'login'
  if (action === 'vote_cast') return 'vote'
  if (action === 'creator_approved' || action === 'creator_rejected') return 'approval'
  if (
    action.startsWith('election_') ||
    action.startsWith('candidate_') ||
    action === 'results_locked'
  ) {
    return 'edit'
  }
  if (
    action === 'election_registration_locked' ||
    action === 'election_registration_unlocked'
  ) {
    return details?.override === true ? 'override' : 'edit'
  }
  return 'other'
}

export function isAdminOverrideLog(log: AuditLogEntry): boolean {
  return log.details?.override === true
}

export function getAuditPresentation(log: AuditLogEntry): AuditPresentation {
  const actorEmail = log.actor?.email ?? 'System'
  const targetEmail = log.target?.email ?? (log.details?.target_email as string | undefined)
  const electionTitle = log.election?.title ?? (log.details?.title as string | undefined)
  const details = log.details ?? {}
  const category = auditLogCategory(log.action, details)
  const isOverride = isAdminOverrideLog(log)

  switch (log.action) {
    case 'user_login':
      return {
        icon: 'login',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        title: 'User login',
        description: `${actorEmail} signed in (${(details.role as string) ?? 'user'}).`,
        category,
        isOverride,
      }
    case 'user_logout':
      return {
        icon: 'logout',
        iconBg: 'bg-surface-container-high',
        iconColor: 'text-on-surface-variant',
        title: 'User logout',
        description: `${actorEmail} signed out.`,
        category,
        isOverride,
      }
    case 'user_signup':
      return {
        icon: 'person_add',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        title: 'New registration',
        description: `${(details.email as string) ?? actorEmail} registered as ${(details.role as string) ?? 'user'}.`,
        category,
        isOverride,
      }
    case 'vote_cast':
      return {
        icon: 'how_to_vote',
        iconBg: 'bg-tertiary/20',
        iconColor: 'text-tertiary',
        title: 'Vote cast',
        description: `Ballot recorded for ${electionTitle ?? 'election'}${details.candidate_name ? ` — ${details.candidate_name as string}` : ''}. Receipt ${(details.receipt_hash as string) ?? 'issued'}.`,
        category,
        isOverride,
      }
    case 'election_created':
      return {
        icon: 'add_circle',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        title: 'Election created',
        description: `${actorEmail} created "${electionTitle ?? (details.title as string) ?? 'election'}".`,
        category,
        isOverride,
      }
    case 'election_published':
      return {
        icon: 'publish',
        iconBg: 'bg-tertiary/20',
        iconColor: 'text-tertiary',
        title: 'Election published',
        description: `${electionTitle ?? (details.title as string) ?? 'Election'} opened for registration.`,
        category,
        isOverride,
      }
    case 'election_activated':
      return {
        icon: 'play_circle',
        iconBg: 'bg-tertiary/20',
        iconColor: 'text-tertiary',
        title: 'Voting activated',
        description: `${electionTitle ?? 'Election'} is now in the active voting phase.`,
        category,
        isOverride,
      }
    case 'election_updated':
      return {
        icon: 'edit_note',
        iconBg: 'bg-surface-container-high',
        iconColor: 'text-on-surface-variant',
        title: 'Election edited',
        description: `${actorEmail} updated ${electionTitle ?? 'an election'} (${(details.old_status as string) ?? '?'} → ${(details.new_status as string) ?? '?'}).`,
        category,
        isOverride,
      }
    case 'candidate_created':
      return {
        icon: 'person',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        title: 'Candidate added',
        description: `${(details.name as string) ?? 'Candidate'} added to ${electionTitle ?? 'election'}.`,
        category,
        isOverride,
      }
    case 'candidate_updated':
      return {
        icon: 'edit',
        iconBg: 'bg-surface-container-high',
        iconColor: 'text-on-surface-variant',
        title: 'Candidate edited',
        description: `${(details.name as string) ?? 'Candidate'} updated in ${electionTitle ?? 'election'}.`,
        category,
        isOverride,
      }
    case 'results_locked':
      return {
        icon: 'lock_clock',
        iconBg: 'bg-secondary/20',
        iconColor: 'text-secondary',
        title: 'Results locked',
        description: `Final results locked for ${electionTitle ?? (details.title as string) ?? 'election'}.`,
        category,
        isOverride,
      }
    case 'election_voter_roll_finalized':
      return {
        icon: 'badge',
        iconBg: 'bg-secondary/20',
        iconColor: 'text-secondary',
        title: 'Voter roll finalized',
        description: `Secret IDs issued for ${electionTitle ?? 'election'}${details.registered_count != null ? ` (${details.registered_count} voters)` : ''}.`,
        category,
        isOverride,
      }
    case 'election_registration_locked':
      return {
        icon: 'lock',
        iconBg: isOverride ? 'bg-amber-500/20' : 'bg-surface-container-high',
        iconColor: isOverride ? 'text-amber-700' : 'text-on-surface-variant',
        title: isOverride ? 'Admin override — lock' : 'Registration locked',
        description: `${electionTitle ?? 'Election'}: ${(details.reason as string) ?? 'locked'}${isOverride ? ' (admin override)' : ''}.`,
        category: isOverride ? 'override' : category,
        isOverride,
      }
    case 'election_registration_unlocked':
      return {
        icon: 'lock_open',
        iconBg: isOverride ? 'bg-amber-500/20' : 'bg-primary/20',
        iconColor: isOverride ? 'text-amber-700' : 'text-primary',
        title: isOverride ? 'Admin override — unlock' : 'Registration unlocked',
        description: `${electionTitle ?? 'Election'}: ${(details.reason as string) ?? 'unlocked'}${isOverride ? ' (admin override)' : ''}.`,
        category: isOverride ? 'override' : category,
        isOverride,
      }
    case 'creator_approved':
      return {
        icon: 'verified',
        iconBg: 'bg-tertiary',
        iconColor: 'text-tertiary-fixed',
        title: 'Creator approved',
        description: `${targetEmail ?? 'User'} granted election creator access.`,
        category,
        isOverride,
      }
    case 'creator_rejected':
      return {
        icon: 'report',
        iconBg: 'bg-error',
        iconColor: 'text-on-error',
        title: 'Creator rejected',
        description: `${targetEmail ?? 'User'} rejected${details.rejection_reason ? `: ${details.rejection_reason as string}` : '.'}`,
        category,
        isOverride,
      }
    default:
      return {
        icon: 'settings',
        iconBg: 'bg-on-surface-variant',
        iconColor: 'text-surface',
        title: log.action.replace(/_/g, ' '),
        description: electionTitle ? String(electionTitle) : JSON.stringify(details),
        category,
        isOverride,
      }
  }
}

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  all: 'All events',
  login: 'Logins',
  vote: 'Votes',
  approval: 'Approvals',
  edit: 'Edits',
  override: 'Admin overrides',
}
