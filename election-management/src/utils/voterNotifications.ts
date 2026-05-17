import type { VoterRegistrationWithElection } from '@/types/voterRegistration'
import { canVote } from '@/utils/voterElectionUi'

export type VoterNotificationKind = 'vote_pending' | 'secret_id' | 'voted' | 'results' | 'waitlist'

export interface VoterNotificationItem {
  id: string
  kind: VoterNotificationKind
  title: string
  sub: string
  timeLabel: string
  href?: string
}

function relTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const h = Math.floor(diff / 3600000)
  if (h < 24) return h <= 0 ? 'Just now' : `${h}h ago`
  const days = Math.floor(diff / 86400000)
  return `${days}d ago`
}

/** Synthetic inbox rows derived from registration state (no backend notifications API yet). */
export function buildVoterNotifications(
  registrations: VoterRegistrationWithElection[],
): VoterNotificationItem[] {
  const items: VoterNotificationItem[] = []

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
        href: `/voter/elections/${electionId}`,
      })
      continue
    }

    if (canVote(r)) {
      items.push({
        id: `vote-${r.id}`,
        kind: 'vote_pending',
        title: `Vote now — ${title}`,
        sub: 'Polling is open. Cast your ballot before it closes.',
        timeLabel: 'Now',
        href: `/voter/vote/${electionId}`,
      })
    } else if (r.secret_voter_id && r.secret_voter_id_assigned_at && !r.voted_at) {
      items.push({
        id: `sid-${r.id}`,
        kind: 'secret_id',
        title: `Secret voter ID issued — ${title}`,
        sub: 'Your ID is ready. Store it securely for ballot verification.',
        timeLabel: relTime(r.secret_voter_id_assigned_at),
        href: `/voter/elections/${electionId}`,
      })
    }

    if (r.voted_at) {
      items.push({
        id: `voted-${r.id}`,
        kind: 'voted',
        title: `Vote recorded — ${title}`,
        sub: 'Your anonymous vote was encrypted and recorded.',
        timeLabel: relTime(r.voted_at),
        href: `/voter/results/${electionId}`,
      })
    }

    const ended = Date.now() > new Date(r.election.end_date).getTime()
    if (ended && ['published', 'active', 'completed'].includes(r.election.status)) {
      items.push({
        id: `res-${r.id}`,
        kind: 'results',
        title: `Results available — ${title}`,
        sub: 'Final tally is published for this election.',
        timeLabel: relTime(r.election.end_date),
        href: `/voter/results/${electionId}`,
      })
    }
  }

  return items
}
