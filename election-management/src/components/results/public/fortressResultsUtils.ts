import type { CandidateResultRow, ElectionResultsPayload, VoteTrendPoint } from '@/types/electionResults'
import { candidateVoteShare } from '@/utils/resultsDisplay'

export const FV_BAR_COLORS = ['#6C63FF', '#06B6D4', '#22C55E', '#F59E0B', '#94A3B8'] as const

export const FV_AVATAR_STYLES = [
  { bg: '#EDE9FE', color: '#4C1D95' },
  { bg: '#CFFAFE', color: '#0E7490' },
  { bg: '#DCFCE7', color: '#166534' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#FCE7F3', color: '#9D174D' },
  { bg: '#E0E7FF', color: '#3730A3' },
] as const

const DONUT_R = 50
const DONUT_C = 2 * Math.PI * DONUT_R

export function candidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

export function formatCountdownHms(endIso: string, nowMs = Date.now()): string {
  const diff = Math.max(0, new Date(endIso).getTime() - nowMs)
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatCompactVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

export type EnrichedCandidate = CandidateResultRow & { share_percent: number }

export function enrichAndSortCandidates(
  candidates: CandidateResultRow[],
  totalVotes: number,
): EnrichedCandidate[] {
  return [...candidates]
    .map((c) => ({
      ...c,
      share_percent: candidateVoteShare(c.vote_count, totalVotes),
    }))
    .sort((a, b) => b.vote_count - a.vote_count)
}

export interface DonutSegment {
  color: string
  dasharray: string
  rotation: number
}

export function buildDonutSegments(rows: EnrichedCandidate[], max = 5): DonutSegment[] {
  const top = rows.slice(0, max)
  const totalShare = top.reduce((s, r) => s + r.share_percent, 0) || 1
  let rotation = -90

  return top.map((row, i) => {
    const share = (row.share_percent / totalShare) * 100
    const len = (share / 100) * DONUT_C
    const seg: DonutSegment = {
      color: FV_BAR_COLORS[i % FV_BAR_COLORS.length] ?? FV_BAR_COLORS[0],
      dasharray: `${len} ${DONUT_C - len}`,
      rotation,
    }
    rotation += (share / 100) * 360
    return seg
  })
}

export function peakVotingHourLabel(trend: VoteTrendPoint[]): string | null {
  if (trend.length === 0) return null
  const peak = [...trend].sort((a, b) => b.votes - a.votes)[0]
  if (!peak?.hour) return null
  const d = new Date(peak.hour)
  if (Number.isNaN(d.getTime())) return null
  const h = d.getHours()
  const next = (h + 1) % 24
  const fmt = (hr: number) => {
    const ap = hr >= 12 ? 'PM' : 'AM'
    const h12 = hr % 12 || 12
    return `${h12}:00 ${ap}`
  }
  return `${fmt(h)}–${fmt(next)}`
}

export function votesPerMinuteLabel(trend: VoteTrendPoint[]): string | null {
  if (trend.length < 2) return null
  const last = trend[trend.length - 1]?.votes ?? 0
  const prev = trend[trend.length - 2]?.votes ?? 0
  const delta = last - prev
  if (delta <= 0) return null
  const perMin = Math.max(1, Math.round(delta / 60))
  return `+${perMin}/min`
}

export interface FeedItem {
  id: string
  color: string
  text: string
  at: number
}

const FEED_TEMPLATES = [
  (n: number) => `+${n} votes added to total count`,
  (name: string) => `${name} holds the current lead`,
  () => 'Turnout milestone updated',
  () => 'Audit checkpoint verified',
  () => 'Ballot count refreshed from secure tally',
]

export function buildFeedFromDelta(
  prevVotes: number,
  current: ElectionResultsPayload,
  leaderName: string | null,
): FeedItem | null {
  const delta = current.total_votes - prevVotes
  const now = Date.now()
  if (delta > 0) {
    return {
      id: `${now}-votes`,
      color: FV_BAR_COLORS[0],
      text: FEED_TEMPLATES[0](delta),
      at: now,
    }
  }
  if (leaderName) {
    return {
      id: `${now}-lead`,
      color: FV_BAR_COLORS[1],
      text: FEED_TEMPLATES[1](leaderName),
      at: now,
    }
  }
  return {
    id: `${now}-audit`,
    color: FV_BAR_COLORS[2],
    text: FEED_TEMPLATES[3](),
    at: now,
  }
}

export function formatFeedAge(atMs: number, nowMs = Date.now()): string {
  const sec = Math.floor((nowMs - atMs) / 1000)
  if (sec < 8) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

export function leaderMargin(
  sorted: EnrichedCandidate[],
): { leadVotes: number; secondVotes: number } | null {
  if (sorted.length < 2) return null
  return {
    leadVotes: sorted[0]!.vote_count - sorted[1]!.vote_count,
    secondVotes: sorted[1]!.vote_count,
  }
}
