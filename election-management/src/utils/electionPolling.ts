import type { Election } from '@/types/election'

export function isPollingOpen(election: Pick<Election, 'start_date' | 'end_date' | 'status' | 'voter_roll_finalized_at'>): boolean {
  if (!election.voter_roll_finalized_at) return false
  if (!['published', 'active'].includes(election.status)) return false

  const now = Date.now()
  const start = new Date(election.start_date).getTime()
  const end = new Date(election.end_date).getTime()

  return now >= start && now <= end
}

export function isPollingNotStarted(election: Pick<Election, 'start_date'>): boolean {
  return Date.now() < new Date(election.start_date).getTime()
}

export function isPollingEnded(election: Pick<Election, 'end_date'>): boolean {
  return Date.now() > new Date(election.end_date).getTime()
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
