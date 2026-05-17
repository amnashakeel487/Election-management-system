import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrowseElectionCard } from '@/components/browse/BrowseElectionCard'
import { BrowseElectionsFooter } from '@/components/browse/BrowseElectionsFooter'
import { BrowseElectionsNav } from '@/components/browse/BrowseElectionsNav'
import { fetchPublicCandidateCounts } from '@/services/browseElectionService'
import { fetchPublicElections, type PublicElectionFilter } from '@/services/electionService'
import { fetchPublicLandingMetrics } from '@/services/publicLandingMetricsService'
import type { Election } from '@/types/election'
import {
  BROWSE_CATEGORIES,
  categorySlugFromElection,
  formatCompactNum,
  isRegistrationJoinable,
  type BrowseCategorySlug,
} from '@/utils/browseElectionUi'
import { publicElectionPhase } from '@/utils/publicElectionLanding'
import '@/styles/browse-elections.css'

const PAGE_SIZE = 6

type SortMode = 'latest' | 'popular' | 'ending'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function sortElections(
  list: Election[],
  sort: SortMode,
  metrics: Map<string, { ballots_cast: number; registered: number }>,
): Election[] {
  const copy = [...list]
  if (sort === 'popular') {
    return copy.sort((a, b) => {
      const aScore = (metrics.get(a.id)?.registered ?? 0) + (metrics.get(a.id)?.ballots_cast ?? 0)
      const bScore = (metrics.get(b.id)?.registered ?? 0) + (metrics.get(b.id)?.ballots_cast ?? 0)
      return bScore - aScore
    })
  }
  if (sort === 'ending') {
    return copy.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
  }
  return copy.sort((a, b) => {
    const aT = new Date(a.updated_at ?? a.published_at ?? a.start_date).getTime()
    const bT = new Date(b.updated_at ?? b.published_at ?? b.start_date).getTime()
    return bT - aT
  })
}

function buildTickerItems(
  elections: Election[],
  metrics: Map<string, { ballots_cast: number; registered: number }>,
  nowMs: number,
): string[] {
  const items: string[] = []
  for (const e of elections) {
    const phase = publicElectionPhase(e, nowMs)
    if (phase !== 'active') continue
    const row = metrics.get(e.id)
    const ballots = row?.ballots_cast ?? 0
    const reg = row?.registered ?? 0
    if (ballots > 0) items.push(`${ballots.toLocaleString()} votes cast in ${e.title}`)
    if (reg > 0 && e.max_voters > 0) {
      const pct = Math.round((reg / e.max_voters) * 100)
      if (pct >= 50) items.push(`${e.title} — ${pct}% registered`)
    }
  }
  for (const e of elections) {
    const phase = publicElectionPhase(e, nowMs)
    if (phase === 'upcoming' && isRegistrationJoinable(e, phase, nowMs)) {
      items.push(`Registration open: ${e.title}`)
    }
  }
  if (items.length === 0) {
    return ['Browse published elections and join when registration is open']
  }
  return items
}

export function BrowseElectionsView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PublicElectionFilter | ''>('')
  const [categoryTab, setCategoryTab] = useState<BrowseCategorySlug>('all')
  const [sort, setSort] = useState<SortMode>('latest')
  const [joinableOnly, setJoinableOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [elections, setElections] = useState<Election[]>([])
  const [metrics, setMetrics] = useState(() => new Map<string, { ballots_cast: number; registered: number }>())
  const [candidateCounts, setCandidateCounts] = useState(() => new Map<string, number>())
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
        const published = await fetchPublicElections('all')
        if (cancelled) return
        const m = await fetchPublicLandingMetrics().catch(() => new Map())
        if (cancelled) return
        const counts = await fetchPublicCandidateCounts(published.map((e) => e.id))
        if (cancelled) return
        setElections(published)
        setMetrics(m)
        setCandidateCounts(counts)
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
  }, [])

  const nowMs = Date.now()
  void tick

  const aggregate = useMemo(() => {
    let live = 0
    let votes = 0
    let registered = 0
    for (const e of elections) {
      const phase = publicElectionPhase(e, nowMs)
      if (phase === 'active') live += 1
      const row = metrics.get(e.id)
      votes += row?.ballots_cast ?? 0
      registered += row?.registered ?? 0
    }
    return { total: elections.length, live, votes, registered }
  }, [elections, metrics, nowMs])

  const categoryCounts = useMemo(() => {
    const counts: Record<BrowseCategorySlug, number> = {
      all: elections.length,
      university: 0,
      government: 0,
      corporate: 0,
      community: 0,
    }
    for (const e of elections) {
      const slug = categorySlugFromElection(e.category)
      if (slug) counts[slug] += 1
    }
    return counts
  }, [elections])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = elections

    if (statusFilter) {
      list = list.filter((e) => publicElectionPhase(e, nowMs) === statusFilter)
    }

    if (categoryTab !== 'all') {
      list = list.filter((e) => categorySlugFromElection(e.category) === categoryTab)
    }

    if (joinableOnly) {
      list = list.filter((e) => {
        const phase = publicElectionPhase(e, nowMs)
        return phase !== 'completed' && isRegistrationJoinable(e, phase, nowMs)
      })
    }

    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description ?? '').toLowerCase().includes(q) ||
          (e.category ?? '').toLowerCase().includes(q),
      )
    }

    return sortElections(list, sort, metrics)
  }, [elections, query, statusFilter, categoryTab, joinableOnly, sort, metrics, nowMs])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, categoryTab, joinableOnly, sort])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const tickerItems = useMemo(() => buildTickerItems(elections, metrics, nowMs), [elections, metrics, nowMs])
  const tickerDoubled = [...tickerItems, ...tickerItems]

  return (
    <div className="be-root">
      <div className="live-ticker">
        <div className="ticker-label">
          <div className="ticker-label-dot" />
          Live
        </div>
        <div className="ticker-track">
          <div className="ticker-items">
            {tickerDoubled.map((text, i) => (
              <span key={`${text}-${i}`} className="ticker-item">
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <BrowseElectionsNav />

      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-orb1" />
        <div className="hero-orb2" />
        <div className="hero-inner">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            {aggregate.live} {aggregate.live === 1 ? 'Election' : 'Elections'} Live Right Now
          </div>
          <h1 className="hero-title">
            Explore <span className="accent">Live & Upcoming</span>
            <br />
            Elections
          </h1>
          <p className="hero-desc">
            Discover transparent, secure elections across universities, governments, corporations and communities.
          </p>
          <div className="hero-ctas">
            <a className="hero-cta primary" href="#browse-grid">
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Browse Elections
            </a>
            <Link className="hero-cta secondary" to="/results">
              <svg viewBox="0 0 24 24" aria-hidden>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              View Live Results
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num cyan">{aggregate.total}</div>
              <div className="hero-stat-label">Total Elections</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num" style={{ color: '#EF4444' }}>
                {aggregate.live}
              </div>
              <div className="hero-stat-label">Live Now</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{formatCompactNum(aggregate.votes)}</div>
              <div className="hero-stat-label">Votes Cast</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{formatCompactNum(aggregate.registered)}</div>
              <div className="hero-stat-label">Registrations</div>
            </div>
          </div>
        </div>
      </section>


      <div className="search-section">
        <div className="search-bar-wrap">
          <SearchIcon />
          <input
            className="search-input"
            type="search"
            placeholder="Search by election title, organization, or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search elections"
          />
        </div>
        <div className="filter-row">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PublicElectionFilter | '')}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="filter-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            aria-label="Sort elections"
          >
            <option value="latest">Sort: Latest</option>
            <option value="popular">Most Popular</option>
            <option value="ending">Ending Soon</option>
          </select>
          <button
            type="button"
            className={`filter-toggle${joinableOnly ? ' on' : ''}`}
            onClick={() => setJoinableOnly((v) => !v)}
          >
            <div className="filter-checkbox">
              {joinableOnly ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : null}
            </div>
            Show only joinable elections
          </button>
          <div className="results-count">
            Showing {pageItems.length} of {filtered.length} elections
          </div>
        </div>
      </div>

      <div className="categories-section">
        <div className="cat-tabs">
          {BROWSE_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              className={`cat-tab${categoryTab === cat.slug ? ' active' : ''}`}
              onClick={() => setCategoryTab(cat.slug)}
            >
              <span className="cat-icon">{cat.icon}</span>
              {cat.label}
              <span className="cat-count">{categoryCounts[cat.slug]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="main-section" id="browse-grid">
        <div className="section-header">
          <div>
            <div className="section-title">Active & Upcoming Elections</div>
            <div className="section-sub">Join, vote, or track results in real-time</div>
          </div>
        </div>

        {loadError ? (
          <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 16 }}>{loadError}</p>
        ) : null}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--subtle)', fontSize: 14 }}>Loading elections…</div>
        ) : (
          <>
            <div className="election-grid">
              {pageItems.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: 'var(--subtle)', fontSize: 14 }}>
                  No elections match your filters.
                </div>
              ) : (
                pageItems.map((election, i) => {
                  const phase = publicElectionPhase(election, nowMs)
                  const row = metrics.get(election.id)
                  return (
                    <BrowseElectionCard
                      key={election.id}
                      election={election}
                      phase={phase}
                      index={(safePage - 1) * PAGE_SIZE + i}
                      nowMs={nowMs}
                      registeredCount={row?.registered ?? 0}
                      ballotCount={row?.ballots_cast ?? 0}
                      candidateCount={candidateCounts.get(election.id) ?? 0}
                    />
                  )
                })
              )}
            </div>

            {totalPages > 1 ? (
              <div className="pagination">
                <button
                  type="button"
                  className="page-btn arrow"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`page-btn${n === safePage ? ' active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="page-btn arrow"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <section className="platform-stats">
        <div className="ps-orb1" />
        <div className="ps-orb2" />
        <div className="ps-grid-bg" />
        <div className="ps-inner">
          <div className="ps-label">Platform at a glance</div>
          <h2 className="ps-title">Trusted by organisations worldwide</h2>
          <div className="ps-cards">
            <div className="ps-card">
              <div className="ps-card-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>
                <svg viewBox="0 0 24 24" stroke="#06B6D4" aria-hidden>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                </svg>
              </div>
              <div className="ps-card-num">{aggregate.total}</div>
              <div className="ps-card-label">Published Elections</div>
            </div>
            <div className="ps-card">
              <div className="ps-card-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <svg viewBox="0 0 24 24" stroke="#10B981" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="ps-card-num">{formatCompactNum(aggregate.votes)}</div>
              <div className="ps-card-label">Votes Cast</div>
            </div>
            <div className="ps-card">
              <div className="ps-card-icon" style={{ background: 'rgba(108,63,197,0.15)' }}>
                <svg viewBox="0 0 24 24" stroke="#6C3FC5" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="ps-card-num">{formatCompactNum(aggregate.registered)}</div>
              <div className="ps-card-label">Registrations</div>
            </div>
            <div className="ps-card">
              <div className="ps-card-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <svg viewBox="0 0 24 24" stroke="#EF4444" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="ps-card-num">{aggregate.live}</div>
              <div className="ps-card-label">Live Now</div>
            </div>
          </div>
        </div>
      </section>

      <BrowseElectionsFooter />
    </div>
  )
}
