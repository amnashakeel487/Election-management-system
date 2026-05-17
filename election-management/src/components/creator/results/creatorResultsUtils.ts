import type { CandidateResultRow, VoteTrendPoint } from '@/types/electionResults'
import { candidateVoteShare } from '@/utils/resultsDisplay'

export const RESULT_BAR_GRADIENTS = [
  'linear-gradient(90deg,#1B3A6B,#2451A3)',
  'linear-gradient(90deg,#6C3FC5,#7C3AED)',
  'linear-gradient(90deg,#06B6D4,#0891B2)',
  'linear-gradient(90deg,#10B981,#059669)',
  'linear-gradient(90deg,#F59E0B,#D97706)',
] as const

export const RESULT_BAR_COLORS = ['#1B3A6B', '#6C3FC5', '#06B6D4', '#10B981', '#F59E0B'] as const

export function candidateFirstName(name: string): string {
  const part = name.trim().split(/\s+/).filter(Boolean)[0]
  return part ?? name
}

export function formatCountdownHm(endDateIso: string, nowMs = Date.now()): string {
  const diff = Math.max(0, new Date(endDateIso).getTime() - nowMs)
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function votesTrendDeltaLabel(trend: VoteTrendPoint[]): string | null {
  if (trend.length < 2) return null
  const last = trend[trend.length - 1]?.votes ?? 0
  const prev = trend[trend.length - 2]?.votes ?? 0
  const delta = last - prev
  if (delta <= 0) return null
  if (delta >= 1000) {
    const k = delta / 1000
    return `+${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K/h`
  }
  return `+${delta}/h`
}

export function turnoutDeltaLabel(trend: VoteTrendPoint[], registered: number): string | null {
  if (registered <= 0 || trend.length < 2) return null
  const last = trend[trend.length - 1]?.votes ?? 0
  const prev = trend[trend.length - 2]?.votes ?? 0
  const deltaVotes = last - prev
  if (deltaVotes <= 0) return null
  const pct = Math.round((deltaVotes / registered) * 100)
  if (pct <= 0) return null
  return `+${pct}%`
}

export function sortCandidatesByVotes(candidates: CandidateResultRow[]): CandidateResultRow[] {
  return [...candidates].sort((a, b) => b.vote_count - a.vote_count)
}

export function enrichResultRows(
  candidates: CandidateResultRow[],
  totalVotes: number,
): Array<CandidateResultRow & { share_percent: number }> {
  return sortCandidatesByVotes(candidates).map((c) => ({
    ...c,
    share_percent: candidateVoteShare(c.vote_count, totalVotes),
  }))
}

export function shortElectionCode(electionId: string): string {
  return electionId.replace(/-/g, '').slice(0, 3).toUpperCase() || '—'
}
