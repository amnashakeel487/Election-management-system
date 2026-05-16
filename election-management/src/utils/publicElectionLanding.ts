import type { Election } from '@/types/election'

export type PublicElectionPhase = 'upcoming' | 'active' | 'completed'

export function publicElectionPhase(election: Election, nowMs = Date.now()): PublicElectionPhase {
  const start = new Date(election.start_date).getTime()
  const end = new Date(election.end_date).getTime()
  if (election.status === 'completed' || nowMs > end) return 'completed'
  if (nowMs < start) return 'upcoming'
  return 'active'
}

/** When we may show aggregate ballot counts on the public landing page. */
export function shouldShowPublicBallotCount(election: Election, phase: PublicElectionPhase, nowMs = Date.now()): boolean {
  if (phase === 'upcoming') return false
  if (phase === 'completed') return true
  if (election.real_time_results) return true
  return nowMs > new Date(election.end_date).getTime()
}
