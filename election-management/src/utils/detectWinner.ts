import type { CandidateResultRow, WinnerOutcome } from '@/types/electionResults'

export function detectWinner(
  candidates: CandidateResultRow[],
  totalVotes: number,
): WinnerOutcome {
  if (totalVotes === 0 || candidates.length === 0) {
    return { type: 'none' }
  }

  const maxVotes = Math.max(...candidates.map((c) => c.vote_count))
  if (maxVotes === 0) {
    return { type: 'none' }
  }

  const leaders = candidates.filter((c) => c.vote_count === maxVotes)
  const share_percent = Math.round((maxVotes / totalVotes) * 1000) / 10

  if (leaders.length > 1) {
    return { type: 'tie', candidates: leaders, vote_count: maxVotes }
  }

  return {
    type: 'winner',
    candidate: leaders[0]!,
    vote_count: maxVotes,
    share_percent,
  }
}
