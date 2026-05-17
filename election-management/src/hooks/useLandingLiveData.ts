import { useEffect, useMemo, useState } from 'react'
import { fetchPublicElections } from '@/services/electionService'
import { fetchPublicLandingMetrics } from '@/services/publicLandingMetricsService'
import type { Election } from '@/types/election'
import { formatCompactNum } from '@/utils/browseElectionUi'
import { publicElectionPhase } from '@/utils/publicElectionLanding'

export type LandingFeaturedElection = {
  id: string
  title: string
  phase: 'active' | 'upcoming'
  progressPct: number
  metaLeft: string
  metaRight: string
  borderColor: string
  barGradient: string
}

export type LandingLiveSnapshot = {
  electionsConducted: number
  registeredVoters: number
  totalVotes: number
  liveElections: number
  featured: LandingFeaturedElection[]
  chartHeights: string[]
}

const CHART_COLORS = ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5', '#4338CA']

const POLL_MS = 45_000

function buildSnapshot(
  elections: Election[],
  metrics: Map<string, { ballots_cast: number; registered: number }>,
  nowMs: number,
): LandingLiveSnapshot {
  let registeredVoters = 0
  let totalVotes = 0
  let liveElections = 0

  const scored: { election: Election; ballots: number }[] = []

  for (const e of elections) {
    const phase = publicElectionPhase(e, nowMs)
    if (phase === 'active') liveElections += 1
    const row = metrics.get(e.id)
    const ballots = row?.ballots_cast ?? 0
    const registered = row?.registered ?? 0
    registeredVoters += registered
    totalVotes += ballots
    if (ballots > 0) scored.push({ election: e, ballots })
  }

  scored.sort((a, b) => b.ballots - a.ballots)
  const maxBallots = scored[0]?.ballots ?? 1

  const chartHeights = Array.from({ length: 7 }, (_, i) => {
    const row = scored[i]
    if (!row) return '18%'
    const pct = Math.max(12, Math.round((row.ballots / maxBallots) * 100))
    return `${pct}%`
  })

  const active = elections.find((e) => publicElectionPhase(e, nowMs) === 'active')
  const upcoming = elections.find((e) => publicElectionPhase(e, nowMs) === 'upcoming')

  const featured: LandingFeaturedElection[] = []

  if (active) {
    const row = metrics.get(active.id)
    const ballots = row?.ballots_cast ?? 0
    const registered = row?.registered ?? 0
    const cap = active.max_voters > 0 ? active.max_voters : Math.max(registered, 1)
    const progressPct = Math.min(100, Math.round((ballots / cap) * 100))
    featured.push({
      id: active.id,
      title: active.title,
      phase: 'active',
      progressPct,
      metaLeft: `${ballots.toLocaleString()} voted`,
      metaRight: `${progressPct}%`,
      borderColor: '#10B981',
      barGradient: 'linear-gradient(90deg,#10B981,#059669)',
    })
  }

  if (upcoming && upcoming.id !== active?.id) {
    const row = metrics.get(upcoming.id)
    const registered = row?.registered ?? 0
    const cap = upcoming.max_voters > 0 ? upcoming.max_voters : Math.max(registered, 1)
    const progressPct = Math.min(100, Math.round((registered / cap) * 100))
    const opens = new Date(upcoming.start_date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    featured.push({
      id: upcoming.id,
      title: upcoming.title,
      phase: 'upcoming',
      progressPct: Math.max(progressPct, 8),
      metaLeft: `${registered.toLocaleString()} registered`,
      metaRight: nowMs < new Date(upcoming.start_date).getTime() ? opens : 'Opens soon',
      borderColor: '#2563EB',
      barGradient: 'linear-gradient(90deg,#2563EB,#1D4ED8)',
    })
  }

  return {
    electionsConducted: elections.length,
    registeredVoters,
    totalVotes,
    liveElections,
    featured,
    chartHeights,
  }
}

const EMPTY_SNAPSHOT: LandingLiveSnapshot = {
  electionsConducted: 0,
  registeredVoters: 0,
  totalVotes: 0,
  liveElections: 0,
  featured: [],
  chartHeights: CHART_COLORS.map(() => '18%'),
}

export function useLandingLiveData() {
  const [elections, setElections] = useState<Election[]>([])
  const [metrics, setMetrics] = useState(() => new Map<string, { ballots_cast: number; registered: number }>())
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const load = async () => {
    try {
      const published = await fetchPublicElections('all')
      const m = await fetchPublicLandingMetrics().catch(() => new Map())
      setElections(published)
      setMetrics(m)
    } catch {
      setElections([])
      setMetrics(new Map())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void load().then(() => {
      if (cancelled) return
    })
    const poll = window.setInterval(() => void load(), POLL_MS)
    const clock = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.clearInterval(clock)
    }
  }, [])

  const nowMs = Date.now()
  void tick

  const snapshot = useMemo(() => {
    if (elections.length === 0) return EMPTY_SNAPSHOT
    return buildSnapshot(elections, metrics, nowMs)
  }, [elections, metrics, nowMs])

  return { snapshot, loading, formatCompactNum }
}
