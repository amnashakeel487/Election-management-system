import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicElections, type PublicElectionFilter } from '@/services/electionService'
import { fetchPublicLandingMetrics } from '@/services/publicLandingMetricsService'
import type { Election } from '@/types/election'
import { formatElectionCode } from '@/utils/electionTime'
import {
  publicElectionPhase,
  shouldShowPublicBallotCount,
  type PublicElectionPhase,
} from '@/utils/publicElectionLanding'

function phaseColor(phase: PublicElectionPhase): string {
  if (phase === 'active') return '#10B981'
  if (phase === 'upcoming') return '#2563EB'
  return '#7C3AED'
}

function splitCountdown(targetIso: string, nowMs: number) {
  const diff = Math.max(0, new Date(targetIso).getTime() - nowMs)
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  }
}

function PhaseBadge({ phase }: { phase: PublicElectionPhase }) {
  if (phase === 'active') {
    return (
      <span className="e-badge active">
        <span className="e-badge-pulse" />
        Active
      </span>
    )
  }
  if (phase === 'upcoming') {
    return <span className="e-badge upcoming">Upcoming</span>
  }
  return <span className="e-badge completed">Completed</span>
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

function CapIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

interface PublicElectionCardProps {
  election: Election
  phase: PublicElectionPhase
  nowMs: number
  registeredCount: number
  ballotCount: number
  showBallots: boolean
  index: number
}

function PublicElectionCard({
  election,
  phase,
  nowMs,
  registeredCount,
  ballotCount,
  showBallots,
  index,
}: PublicElectionCardProps) {
  const color = phaseColor(phase)
  const turnout =
    election.max_voters > 0 && showBallots ? Math.min(100, Math.round((ballotCount / election.max_voters) * 100)) : 0
  const targetIso = phase === 'upcoming' ? election.start_date : election.end_date
  const countdown = phase !== 'completed' ? splitCountdown(targetIso, nowMs) : null
  const desc = election.description?.trim() || 'No description provided.'

  return (
    <article className="e-card" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="e-card-accent" style={{ background: `linear-gradient(90deg,${color},${color}66)` }} />
      <div className="e-card-body">
        <div className="e-card-top">
          <PhaseBadge phase={phase} />
          <span className="e-id">#{formatElectionCode(election.id)}</span>
        </div>
        <div className="e-title">{election.title}</div>
        <div className="e-desc">{desc}</div>

        {phase === 'active' && showBallots ? (
          <>
            <div className="e-progress-label">
              <span>Voter turnout</span>
              <span>
                {ballotCount.toLocaleString()} votes · {turnout}%
              </span>
            </div>
            <div className="e-bar-wrap">
              <div
                className="e-bar-fill"
                style={{ width: `${turnout}%`, background: `linear-gradient(90deg,${color},${color}bb)` }}
              />
            </div>
          </>
        ) : null}

        {countdown ? (
          <div className="e-countdown">
            {[
              { v: countdown.hours, l: 'Hrs' },
              { v: countdown.minutes, l: 'Min' },
              { v: countdown.seconds, l: 'Sec' },
            ].map((u) => (
              <div key={u.l} className="e-count-unit">
                <div className="e-count-num">{String(u.v).padStart(2, '0')}</div>
                <div className="e-count-label">{u.l}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="e-meta">
          <span>
            <UsersIcon />
            {registeredCount.toLocaleString()} registered
          </span>
          {election.category?.trim() ? (
            <span>
              <TagIcon />
              {election.category.trim()}
            </span>
          ) : (
            <span>
              <CapIcon />
              {election.max_voters.toLocaleString()} max
            </span>
          )}
        </div>
        <div className="e-actions">
          <Link to={`/elections/${election.id}`} className="btn-detail">
            View details
          </Link>
          {phase === 'active' || phase === 'upcoming' ? (
            <Link to={`/elections/${election.id}`} className="btn-vote">
              {phase === 'active' ? 'Join election' : 'Register interest'}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function sortByRecent(a: Election, b: Election): number {
  const aT = new Date(a.updated_at ?? a.published_at ?? a.start_date).getTime()
  const bT = new Date(b.updated_at ?? b.published_at ?? b.start_date).getTime()
  return bT - aT
}

export interface PublicElectionCatalogProps {
  /** Show only the N most recently updated elections (after search/filter). */
  limit?: number
  /** Show a link to the full browse page. */
  showViewAll?: boolean
  /** Hide search and status filters (landing teaser). */
  hideToolbar?: boolean
  sectionId?: string
}

export function PublicElectionCatalog({
  limit,
  showViewAll = false,
  hideToolbar = false,
  sectionId = 'elections-catalog',
}: PublicElectionCatalogProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PublicElectionFilter>('all')
  const [elections, setElections] = useState<Election[]>([])
  const [metrics, setMetrics] = useState(() => new Map<string, { ballots_cast: number; registered: number }>())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

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
  void tick

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    const list = q
      ? elections.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            (e.description ?? '').toLowerCase().includes(q) ||
            (e.category ?? '').toLowerCase().includes(q),
        )
      : elections

    const sorted = [...list].sort(sortByRecent)
    return limit != null ? sorted.slice(0, limit) : sorted
  }, [elections, q, limit])

  const filters: { id: PublicElectionFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ]

  return (
    <section className="elections-section section" id={sectionId}>
      <div className="section-inner">
        <div className="section-header">
          <div className="reveal-left">
            <div className="section-eyebrow">Live elections</div>
            <h2 className="section-title">
              Active & <span className="accent">Upcoming</span>
              <br />
              Elections
            </h2>
            <p className="section-sub" style={{ fontSize: 14, marginTop: 8 }}>
              Browse and participate in ongoing democratic processes across organisations.
            </p>
          </div>
          {!hideToolbar ? (
            <div
              className="reveal-right"
              style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}
            >
              <div className="search-wrap">
                <SearchIcon />
                <input
                  type="search"
                  placeholder="Search elections…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search elections"
                />
              </div>
              <div className="filter-row">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`filter-btn${statusFilter === f.id ? ' active' : ''}`}
                    onClick={() => setStatusFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {loadError ? <p style={{ color: '#EF4444', fontSize: 14, marginBottom: 16 }}>{loadError}</p> : null}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontSize: 14 }}>Loading elections…</div>
        ) : (
          <>
            <div className="elections-grid">
              {filtered.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: '#94A3B8', fontSize: 14 }}>
                  No elections found matching your search.
                </div>
              ) : (
                filtered.map((election, i) => {
                  const phase = publicElectionPhase(election, nowMs)
                  const row = metrics.get(election.id)
                  const registeredCount = row?.registered ?? 0
                  const ballotCount = row?.ballots_cast ?? 0
                  const showBallots = shouldShowPublicBallotCount(election, phase, nowMs)

                  return (
                    <PublicElectionCard
                      key={election.id}
                      election={election}
                      phase={phase}
                      nowMs={nowMs}
                      registeredCount={registeredCount}
                      ballotCount={ballotCount}
                      showBallots={showBallots}
                      index={i}
                    />
                  )
                })
              )}
            </div>

            {showViewAll ? (
              <div className="catalog-view-all-wrap">
                <Link to="/browse-elections" className="catalog-view-all-btn">
                  View all elections
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
