type ElectionTiming = {
  status: string
  start_date: string
  end_date: string
  voter_roll_finalized_at?: string | null
}

/** Voting window has started for a published/active election. */
export function isVotingWindowStarted(election: Pick<ElectionTiming, 'status' | 'start_date'>): boolean {
  if (!['published', 'active'].includes(election.status)) return false
  return Date.now() >= new Date(election.start_date).getTime()
}

/** Call backend to finalize roll + email secret IDs when voting should be open. */
export function shouldEnsureVotingReady(election: ElectionTiming): boolean {
  if (!['published', 'active'].includes(election.status)) return false
  if (!isVotingWindowStarted(election)) return false
  if (Date.now() > new Date(election.end_date).getTime()) return false
  return true
}
