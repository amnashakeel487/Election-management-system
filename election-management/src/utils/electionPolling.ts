import type { Election } from '@/types/election'

export type PollingPhase = 'not_finalized' | 'not_started' | 'open' | 'ended' | 'closed'

export function getPollingPhase(
  election: Pick<Election, 'start_date' | 'end_date' | 'status' | 'voter_roll_finalized_at'>,
): PollingPhase {
  if (!['published', 'active'].includes(election.status)) return 'closed'

  const now = Date.now()
  const start = new Date(election.start_date).getTime()
  const end = new Date(election.end_date).getTime()

  if (now < start) return 'not_started'
  if (now > end) return 'ended'
  return 'open'
}

export function isPollingOpen(
  election: Pick<Election, 'start_date' | 'end_date' | 'status' | 'voter_roll_finalized_at'>,
): boolean {
  return getPollingPhase(election) === 'open'
}

export function isPollingNotStarted(election: Pick<Election, 'start_date' | 'status'>): boolean {
  if (!['published', 'active'].includes(election.status)) return false
  return Date.now() < new Date(election.start_date).getTime()
}

export function isPollingEnded(
  election: Pick<Election, 'end_date'> &
    Partial<{ voter_roll_finalized_at: string | null; status: string }>,
): boolean {
  if (election.status === undefined) {
    return Date.now() > new Date(election.end_date).getTime()
  }
  if (!['published', 'active'].includes(election.status)) return true
  return Date.now() > new Date(election.end_date).getTime()
}

export function msUntilPollingOpens(election: Pick<Election, 'start_date'>): number {
  return Math.max(0, new Date(election.start_date).getTime() - Date.now())
}

export function msUntilPollingCloses(election: Pick<Election, 'end_date'>): number {
  return Math.max(0, new Date(election.end_date).getTime() - Date.now())
}

export function formatCountdownMs(ms: number): string {
  const total = Math.max(0, ms)
  const hours = Math.floor(total / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function pollingPhaseLabel(phase: PollingPhase): string {
  switch (phase) {
    case 'not_finalized':
      return 'Voting is not open yet'
    case 'not_started':
      return 'Voting has not started yet'
    case 'open':
      return 'Voting is open'
    case 'ended':
      return 'Voting period has ended'
    case 'closed':
      return 'Election is not open for voting'
  }
}
