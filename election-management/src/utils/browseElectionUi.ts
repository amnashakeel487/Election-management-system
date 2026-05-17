import type { Election } from '@/types/election'
import type { PublicElectionPhase } from '@/utils/publicElectionLanding'
import { formatTimeRemaining, formatTimeUntil } from '@/utils/electionTime'

export type BrowseCategorySlug = 'all' | 'university' | 'government' | 'corporate' | 'community'

export const BROWSE_CATEGORIES: {
  slug: BrowseCategorySlug
  label: string
  icon: string
}[] = [
  { slug: 'all', label: 'All Elections', icon: '🗳️' },
  { slug: 'university', label: 'University', icon: '🎓' },
  { slug: 'government', label: 'Government', icon: '🏛️' },
  { slug: 'corporate', label: 'Corporate', icon: '💼' },
  { slug: 'community', label: 'Community', icon: '🌍' },
]

const GRAD_CLASSES = ['uni', 'gov', 'corp', 'comm', 'uni2', 'gov2'] as const

export function categorySlugFromElection(category: string | null | undefined): BrowseCategorySlug | null {
  if (!category?.trim()) return null
  const c = category.trim().toLowerCase()
  if (c.includes('univers') || c.includes('student') || c.includes('faculty')) return 'university'
  if (c.includes('gov') || c.includes('municipal') || c.includes('public')) return 'government'
  if (c.includes('corp') || c.includes('board') || c.includes('shareholder')) return 'corporate'
  if (c.includes('commun') || c.includes('resident') || c.includes('association')) return 'community'
  return null
}

export function categoryDisplay(category: string | null | undefined): { label: string; icon: string; slug: BrowseCategorySlug | null } {
  const slug = categorySlugFromElection(category)
  if (slug) {
    const row = BROWSE_CATEGORIES.find((c) => c.slug === slug)
    return { label: row?.label ?? category ?? 'General', icon: row?.icon ?? '🗳️', slug }
  }
  const label = category?.trim() || 'General'
  return { label, icon: '🗳️', slug: null }
}

export function bannerGradClass(index: number, slug: BrowseCategorySlug | null): string {
  if (slug === 'university') return index % 2 === 0 ? 'uni' : 'uni2'
  if (slug === 'government') return index % 2 === 0 ? 'gov' : 'gov2'
  if (slug === 'corporate') return 'corp'
  if (slug === 'community') return 'comm'
  return GRAD_CLASSES[index % GRAD_CLASSES.length]
}

export function isRegistrationJoinable(election: Election, phase: PublicElectionPhase, nowMs = Date.now()): boolean {
  if (phase === 'completed') return false
  if (election.registration_locked_at) return false
  if (election.registration_deadline) {
    if (nowMs > new Date(election.registration_deadline).getTime()) return false
  }
  return true
}

export function electionTimerLabel(
  election: Election,
  phase: PublicElectionPhase,
  nowMs = Date.now(),
): { text: string; closing: boolean; success?: boolean } {
  if (phase === 'completed') {
    return {
      text: `Ended ${new Date(election.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · Results available`,
      closing: false,
      success: true,
    }
  }
  if (phase === 'upcoming') {
    const regOpen = isRegistrationJoinable(election, phase, nowMs)
    return {
      text: regOpen
        ? `Starts in ${formatTimeUntil(election.start_date, nowMs)} · Registration open`
        : `Starts in ${formatTimeUntil(election.start_date, nowMs)}`,
      closing: false,
    }
  }
  const msLeft = new Date(election.end_date).getTime() - nowMs
  const closing = msLeft > 0 && msLeft < 9 * 60 * 60 * 1000
  return {
    text: closing
      ? `Ends in ${formatTimeRemaining(election.end_date, nowMs)} — Closing soon!`
      : `Ends in ${formatTimeRemaining(election.end_date, nowMs)}`,
    closing,
  }
}

export function formatCountdownHms(targetIso: string, nowMs = Date.now()): string {
  const diff = Math.max(0, new Date(targetIso).getTime() - nowMs)
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatCompactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}

export function organizationLine(election: Election): string {
  const cat = election.category?.trim()
  if (cat) return cat
  return 'Hosted on FortressVote'
}
