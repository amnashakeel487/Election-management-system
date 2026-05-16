import type { CandidateResultRow, ElectionResultsPayload } from '@/types/electionResults'
import { detectWinner } from '@/utils/detectWinner'

export function candidateVoteShare(voteCount: number, totalVotes: number): number {
  if (totalVotes <= 0) return 0
  return Math.round((voteCount / totalVotes) * 1000) / 10
}

export function formatTurnoutPercent(turnout: number): string {
  return `${turnout.toFixed(turnout % 1 === 0 ? 0 : 1)}%`
}

export function resultsPhaseLabel(results: ElectionResultsPayload): string {
  if (results.results_locked_at) return 'Final results locked'
  if (results.is_live) return 'Live counting'
  if (results.polling_ended) return 'Final results'
  return 'Results available'
}

export function canLockResults(
  results: ElectionResultsPayload,
  isCreator: boolean,
): boolean {
  return (
    isCreator &&
    !results.results_locked_at &&
    results.polling_ended &&
    results.total_votes >= 0
  )
}

export function buildResultsSummary(results: ElectionResultsPayload) {
  const outcome = detectWinner(results.candidates, results.total_votes)
  const leaderIds = new Set<string>(
    outcome.type === 'winner'
      ? [outcome.candidate.candidate_id]
      : outcome.type === 'tie'
        ? outcome.candidates.map((c) => c.candidate_id)
        : [],
  )

  return { outcome, leaderIds }
}

export function enrichCandidatesWithShare(
  candidates: CandidateResultRow[],
  totalVotes: number,
): Array<CandidateResultRow & { share_percent: number }> {
  return candidates.map((c) => ({
    ...c,
    share_percent: candidateVoteShare(c.vote_count, totalVotes),
  }))
}
