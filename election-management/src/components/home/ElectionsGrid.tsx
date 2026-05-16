import { useEffect, useState } from 'react'
import { fetchPublicElections, type PublicElectionFilter } from '@/services/electionService'
import { fetchPublicLandingMetrics } from '@/services/publicLandingMetricsService'
import type { Election } from '@/types/election'
import { formatTimeRemaining, formatTimeUntil } from '@/utils/electionTime'
import { publicElectionPhase, shouldShowPublicBallotCount } from '@/utils/publicElectionLanding'
import { ElectionCard } from './ElectionCard'

interface ElectionsGridProps {
  query: string
  statusFilter: PublicElectionFilter
}

function shortEndedLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export function ElectionsGrid({ query, statusFilter }: ElectionsGridProps) {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [metricsVersion, setMetricsVersion] = useState(0)
  const [metrics, setMetrics] = useState(() => new Map<string, { ballots_cast: number; registered: number }>())

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [published, m] = await Promise.all([
          fetchPublicElections(statusFilter),
          fetchPublicLandingMetrics().catch(() => new Map()),
        ])
        if (cancelled) return
        setElections(published)
        setMetrics(m)
        setMetricsVersion((v) => v + 1)
      } catch (err) {
        if (!cancelled) {
          setElections([])
          setLoadError(err instanceof Error ? err.message : 'Failed to load elections')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const slow = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(slow)
    }
  }, [statusFilter])

  const nowMs = Date.now()
  const q = query.trim().toLowerCase()
  const filtered = q
    ? elections.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description ?? '').toLowerCase().includes(q) ||
          (e.category ?? '').toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q),
      )
    : elections

  // tick + metricsVersion force recompute of countdown strings
  void tick
  void metricsVersion

  return (
    <section className="px-4 py-8 sm:px-margin sm:py-2xl">
      <div className="mx-auto max-w-6xl">
        {loadError ? (
          <p className="rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 font-body-sm text-error">
            {loadError}
          </p>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            <p className="font-body-md text-on-surface-variant">Loading elections…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 py-14 text-center">
            <p className="font-body-md text-on-surface-variant">No elections match your filters or search.</p>
            <p className="mt-2 font-body-sm text-on-surface-variant/80">Try &quot;All&quot; or clear the search box.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-gutter lg:grid-cols-3">
            {filtered.map((election) => {
              const phase = publicElectionPhase(election, nowMs)
              const row = metrics.get(election.id)
              const registeredCount = row?.registered ?? 0
              const ballotCount = row?.ballots_cast ?? 0
              const showBallots = shouldShowPublicBallotCount(election, phase, nowMs)

              let timeLabel = 'Schedule'
              let timeValue = '—'
              if (phase === 'upcoming') {
                timeLabel = 'Voting opens in'
                timeValue = formatTimeUntil(election.start_date, nowMs)
              } else if (phase === 'active') {
                timeLabel = 'Voting ends in'
                timeValue = formatTimeRemaining(election.end_date, nowMs)
              } else {
                timeLabel = 'Closed'
                timeValue = shortEndedLabel(election.end_date)
              }

              return (
                <li key={election.id} className="min-w-0">
                  <ElectionCard
                    title={election.title}
                    description={election.description}
                    category={election.category}
                    phase={phase}
                    detailPath={`/elections/${election.id}`}
                    timeLabel={timeLabel}
                    timeValue={timeValue}
                    maxVoters={election.max_voters}
                    registeredCount={registeredCount}
                    showBallotCount={showBallots}
                    ballotCount={ballotCount}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
