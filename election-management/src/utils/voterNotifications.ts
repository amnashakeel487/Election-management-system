import type { NotificationLogRow, NotificationType } from '@/types/notification'
import type { VoterRegistrationWithElection } from '@/types/voterRegistration'
import { canVote } from '@/utils/voterElectionUi'

export type VoterNotificationKind =
  | 'registered'
  | 'vote_pending'
  | 'secret_id'
  | 'voted'
  | 'results'
  | 'waitlist'
  | 'promoted'
  | 'election_start'
  | 'election_end'

export interface VoterNotificationItem {
  id: string
  kind: VoterNotificationKind
  title: string
  sub: string
  timeLabel: string
  sortAt: number
  href?: string
  /** Collapse duplicate live + log rows for the same event */
  dedupeKey?: string
  unread?: boolean
}

export function relTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  if (diff < 60_000) return 'Just now'
  const h = Math.floor(diff / 3_600_000)
  if (h < 24) return h <= 0 ? 'Just now' : `${h}h ago`
  const days = Math.floor(diff / 86_400_000)
  return `${days}d ago`
}

function electionTitleFromLog(log: NotificationLogRow): string {
  const meta = log.metadata ?? {}
  const fromMeta = meta.election_title
  if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim()
  if (log.subject?.includes('—')) {
    return log.subject.split('—').pop()?.trim() ?? 'Election'
  }
  return 'Election'
}

function mapLogToVoterNotification(log: NotificationLogRow): VoterNotificationItem | null {
  const electionId = log.election_id ?? undefined
  const title = electionTitleFromLog(log)
  const sortAt = new Date(log.sent_at ?? log.created_at).getTime()
  const href = electionId ? `/voter/elections/${electionId}` : undefined
  const displayTitle = log.subject?.trim() || ''

  const base = {
    id: `log-${log.id}`,
    timeLabel: relTime(log.sent_at ?? log.created_at),
    sortAt,
    href,
    unread: true,
  }

  switch (log.notification_type as NotificationType) {
    case 'secret_voter_id':
      return {
        ...base,
        kind: 'secret_id',
        title: displayTitle || `Secret voter ID issued — ${title}`,
        sub: 'Your ID is ready. Store it securely for ballot verification.',
        dedupeKey: electionId ? `secret:${electionId}` : undefined,
      }
    case 'election_start':
      return {
        ...base,
        kind: 'election_start',
        title: displayTitle || `Voting open — ${title}`,
        sub: 'Polling has started. Cast your ballot before it closes.',
        dedupeKey: electionId ? `vote:${electionId}` : undefined,
        href: electionId ? `/voter/vote/${electionId}` : href,
      }
    case 'election_end':
      return {
        ...base,
        kind: 'election_end',
        title: displayTitle || `Voting closed — ${title}`,
        sub: 'Ballots are sealed. Results will be published when available.',
        dedupeKey: electionId ? `ended:${electionId}` : undefined,
      }
    case 'winner':
      return {
        ...base,
        kind: 'results',
        title: displayTitle || `Results available — ${title}`,
        sub: 'Final tally is published for this election.',
        dedupeKey: electionId ? `results:${electionId}` : undefined,
        href: electionId ? `/voter/results/${electionId}` : href,
      }
    case 'waitlist_joined':
      return {
        ...base,
        kind: 'waitlist',
        title: displayTitle || `Waitlist — ${title}`,
        sub: 'You will be notified when a seat opens.',
        dedupeKey: electionId ? `waitlist:${electionId}` : undefined,
      }
    case 'waitlist_promoted':
      return {
        ...base,
        kind: 'promoted',
        title: displayTitle || `Promoted from waitlist — ${title}`,
        sub: 'You are registered. Check for your secret voter ID when issued.',
        dedupeKey: electionId ? `promoted:${electionId}` : undefined,
      }
    case 'voter_registered':
      return {
        ...base,
        kind: 'registered',
        title: displayTitle || `Registered — ${title}`,
        sub: 'You are registered for this election. We will notify you when voting opens.',
        dedupeKey: electionId ? `registered:${electionId}` : undefined,
      }
    default:
      return null
  }
}

/** Live inbox rows from registration + election state */
export function buildVoterNotifications(
  registrations: VoterRegistrationWithElection[],
): VoterNotificationItem[] {
  const items: VoterNotificationItem[] = []
  const now = Date.now()

  for (const r of registrations) {
    if (!r.election) continue
    const title = r.election.title
    const electionId = r.election.id

    if (r.status === 'waitlisted') {
      items.push({
        id: `wl-${r.id}`,
        kind: 'waitlist',
        title: `Waitlist — ${title}`,
        sub: 'You will be notified when a seat opens.',
        timeLabel: relTime(r.created_at),
        sortAt: new Date(r.created_at).getTime(),
        href: `/voter/elections/${electionId}`,
        dedupeKey: `waitlist:${electionId}`,
        unread: true,
      })
      continue
    }

    if (
      r.status === 'registered' &&
      !r.voted_at &&
      !canVote(r) &&
      !r.secret_voter_id
    ) {
      items.push({
        id: `reg-${r.id}`,
        kind: 'registered',
        title: `Registered — ${title}`,
        sub: 'You are registered for this election. We will notify you when voting opens.',
        timeLabel: relTime(r.created_at),
        sortAt: new Date(r.created_at).getTime(),
        href: `/voter/elections/${electionId}`,
        dedupeKey: `registered:${electionId}`,
        unread: true,
      })
    }

    if (canVote(r)) {
      items.push({
        id: `vote-${r.id}`,
        kind: 'vote_pending',
        title: `Vote now — ${title}`,
        sub: 'Polling is open. Cast your ballot before it closes.',
        timeLabel: 'Now',
        sortAt: now,
        href: `/voter/vote/${electionId}`,
        dedupeKey: `vote:${electionId}`,
        unread: true,
      })
    } else if (r.secret_voter_id && r.secret_voter_id_assigned_at && !r.voted_at) {
      items.push({
        id: `sid-${r.id}`,
        kind: 'secret_id',
        title: `Secret voter ID issued — ${title}`,
        sub: 'Your ID is ready. Store it securely for ballot verification.',
        timeLabel: relTime(r.secret_voter_id_assigned_at),
        sortAt: new Date(r.secret_voter_id_assigned_at).getTime(),
        href: `/voter/elections/${electionId}`,
        dedupeKey: `secret:${electionId}`,
        unread: true,
      })
    }

    if (r.voted_at) {
      items.push({
        id: `voted-${r.id}`,
        kind: 'voted',
        title: `Vote recorded — ${title}`,
        sub: 'Your anonymous vote was encrypted and recorded.',
        timeLabel: relTime(r.voted_at),
        sortAt: new Date(r.voted_at).getTime(),
        href: `/voter/results/${electionId}`,
        dedupeKey: `voted:${electionId}`,
        unread: false,
      })
    }

    const ended = now > new Date(r.election.end_date).getTime()
    if (ended && ['published', 'active', 'completed'].includes(r.election.status)) {
      items.push({
        id: `res-${r.id}`,
        kind: 'results',
        title: `Results available — ${title}`,
        sub: 'Final tally is published for this election.',
        timeLabel: relTime(r.election.end_date),
        sortAt: new Date(r.election.end_date).getTime(),
        href: `/voter/results/${electionId}`,
        dedupeKey: `results:${electionId}`,
        unread: true,
      })
    }
  }

  return items
}

/** Merge DB delivery logs with live registration-derived alerts */
export function mergeVoterInbox(
  registrations: VoterRegistrationWithElection[],
  logs: NotificationLogRow[],
): VoterNotificationItem[] {
  const fromLogs = logs
    .map(mapLogToVoterNotification)
    .filter((n): n is VoterNotificationItem => n !== null)

  const seen = new Set(fromLogs.map((n) => n.dedupeKey).filter(Boolean) as string[])
  const derived = buildVoterNotifications(registrations)

  const merged = [...fromLogs]
  for (const item of derived) {
    if (item.dedupeKey && seen.has(item.dedupeKey)) continue
    merged.push(item)
  }

  return merged.sort((a, b) => b.sortAt - a.sortAt)
}

export function countUnreadNotifications(items: VoterNotificationItem[]): number {
  return items.filter((n) => n.unread !== false).length
}
