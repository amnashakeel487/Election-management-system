import type { ElectionWithCandidates } from '@/types/election'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatTimeRemaining, formatTimeUntil } from '@/utils/electionTime'

export type EhStatusClass = 'active' | 'upcoming' | 'draft' | 'completed' | 'suspended'

export function ehStatusClass(election: ElectionWithCandidates, nowMs = Date.now()): EhStatusClass {
  const phase = electionDisplayStatus(election.status, election.start_date, election.end_date, nowMs)
  if (phase === 'pending') return 'suspended'
  return phase
}

export function ehStatusLabel(status: EhStatusClass): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'upcoming':
      return 'Upcoming'
    case 'draft':
      return 'Draft'
    case 'completed':
      return 'Completed'
    default:
      return 'Suspended'
  }
}

export function candidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function formatDeadlineCountdown(iso: string | null | undefined, nowMs = Date.now()): string | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - nowMs
  if (diff <= 0) return 'Closed'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  if (days > 0) return `${days} Day${days === 1 ? '' : 's'} · ${hours} Hour${hours === 1 ? '' : 's'}`
  if (hours > 0) return `${hours} Hour${hours === 1 ? '' : 's'} · ${minutes} Min`
  return `${minutes} Min`
}

/** Compact countdown for progress header, e.g. "2d 14h". */
export function formatClosesInShort(iso: string | null | undefined, nowMs = Date.now()): string | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - nowMs
  if (diff <= 0) return 'Closed'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return `${minutes}m`
}

export function isRegistrationClosingSoon(
  iso: string | null | undefined,
  nowMs = Date.now(),
  withinHours = 48,
): boolean {
  if (!iso) return false
  const diff = new Date(iso).getTime() - nowMs
  if (diff <= 0) return false
  return diff <= withinHours * 3_600_000
}

export function votingCountdownLabel(election: ElectionWithCandidates, nowMs = Date.now()): string {
  const phase = electionDisplayStatus(election.status, election.start_date, election.end_date, nowMs)
  if (phase === 'upcoming') return `Voting starts in ${formatTimeUntil(election.start_date, nowMs)}`
  if (phase === 'active') return `Voting ends in ${formatTimeRemaining(election.end_date, nowMs)}`
  if (election.registration_deadline) {
    const reg = formatDeadlineCountdown(election.registration_deadline, nowMs)
    if (reg && reg !== 'Closed') return `Registration closes in ${reg}`
  }
  return 'Election timeline'
}

export function registrationFillPercent(stats: ElectionRegistrationStats | null): number {
  if (!stats || stats.max_voters <= 0) return 0
  return Math.min(100, (stats.registered_count / stats.max_voters) * 100)
}

export function candidateVoteShare(
  candidateId: string,
  results: ElectionResultsPayload | null,
): { pct: number; votes: number } {
  if (!results || results.total_votes <= 0) return { pct: 0, votes: 0 }
  const row = results.candidates.find((c) => c.candidate_id === candidateId)
  const votes = row?.vote_count ?? 0
  return { pct: Math.round((votes / results.total_votes) * 1000) / 10, votes }
}

export const CED_SECTIONS = [
  { id: 'sec-stats', label: 'Stats' },
  { id: 'sec-info', label: 'Info' },
  { id: 'sec-candidates', label: 'Candidates' },
  { id: 'sec-participants', label: 'Participants' },
  { id: 'sec-registration', label: 'Registration' },
  { id: 'sec-qr', label: 'QR Invite' },
  { id: 'sec-controls', label: 'Controls' },
  { id: 'sec-live', label: 'Live Stats' },
  { id: 'sec-results', label: 'Results' },
  { id: 'sec-audit', label: 'Audit' },
] as const

export function auditDotClass(category: string): string {
  switch (category) {
    case 'login':
      return 'blue'
    case 'vote':
      return 'green'
    case 'approval':
      return 'purple'
    case 'override':
      return 'red'
    default:
      return 'orange'
  }
}
