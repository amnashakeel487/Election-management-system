import type { VoteTrendPoint } from '@/types/electionResults'

export const LR_BAR_FILLS = [
  'linear-gradient(90deg,#F59E0B,#d97706)',
  'linear-gradient(90deg,#2451A3,#1B3A6B)',
  'linear-gradient(90deg,#6C3FC5,#9333ea)',
  'linear-gradient(90deg,#06B6D4,#0891b2)',
  'linear-gradient(90deg,#10B981,#059669)',
  'linear-gradient(90deg,#94A3B8,#64748b)',
] as const

export const LR_DONUT_COLORS = ['#F59E0B', '#2451A3', '#6C3FC5', '#06B6D4', '#10B981'] as const

export const LR_AVATAR_GRADS = [
  'linear-gradient(135deg,#1B3A6B,#2451A3)',
  'linear-gradient(135deg,#065f46,#10B981)',
  'linear-gradient(135deg,#6C3FC5,#9333ea)',
  'linear-gradient(135deg,#0369a1,#06B6D4)',
  'linear-gradient(135deg,#92400E,#1B3A6B)',
  'linear-gradient(135deg,#0F2347,#06B6D4)',
] as const

const DONUT_R = 72
const DONUT_C = 2 * Math.PI * DONUT_R

export interface LiveDonutSegment {
  color: string
  dasharray: string
  dashoffset: number
}

export function buildLiveDonutSegments(rows: { share_percent: number }[], max = 4): LiveDonutSegment[] {
  const top = rows.slice(0, max)
  const total = top.reduce((s, r) => s + r.share_percent, 0) || 1
  let offset = 0

  return top.map((row, i) => {
    const share = (row.share_percent / total) * 100
    const len = (share / 100) * DONUT_C
    const seg: LiveDonutSegment = {
      color: LR_DONUT_COLORS[i % LR_DONUT_COLORS.length] ?? LR_DONUT_COLORS[0],
      dasharray: `${len} ${DONUT_C - len}`,
      dashoffset: -offset,
    }
    offset += len
    return seg
  })
}

export function splitCountdownParts(endIso: string, nowMs = Date.now()) {
  const diff = Math.max(0, new Date(endIso).getTime() - nowMs)
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  }
}

export interface HourlyBar {
  label: string
  heightPct: number
  votes: number
  isPeak: boolean
}

export function buildHourlyBars(trend: VoteTrendPoint[], maxBars = 10): HourlyBar[] {
  if (trend.length === 0) return []
  const slice = trend.slice(-maxBars)
  const maxVotes = Math.max(...slice.map((p) => p.votes), 1)
  let peakIdx = 0
  let peakVal = 0
  slice.forEach((p, i) => {
    if (p.votes > peakVal) {
      peakVal = p.votes
      peakIdx = i
    }
  })

  return slice.map((p, i) => {
    const d = new Date(p.hour)
    const label = Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString(undefined, { hour: 'numeric' }).toLowerCase().replace(' ', '')
    return {
      label,
      heightPct: Math.max(8, Math.round((p.votes / maxVotes) * 100)),
      votes: p.votes,
      isPeak: i === peakIdx,
    }
  })
}

export function rankClass(index: number): string {
  if (index === 0) return 'r1'
  if (index === 1) return 'r2'
  if (index === 2) return 'r3'
  return ''
}

export function categoryBadgeLabel(category: string | null | undefined): { label: string; icon: string } {
  const c = category?.trim().toLowerCase() ?? ''
  if (c.includes('univers') || c.includes('student')) return { label: 'University Election', icon: '🎓' }
  if (c.includes('gov')) return { label: 'Government Election', icon: '🏛️' }
  if (c.includes('corp')) return { label: 'Corporate Election', icon: '💼' }
  if (c.includes('commun')) return { label: 'Community Election', icon: '🌍' }
  if (category?.trim()) return { label: category.trim(), icon: '🗳️' }
  return { label: 'General Election', icon: '🗳️' }
}
