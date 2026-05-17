import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LiveResultsFooter } from '@/components/results/live/LiveResultsFooter'
import { LiveResultsNav } from '@/components/results/live/LiveResultsNav'
import { fetchElectionsWithVisibleResults, type ResultsElectionListItem } from '@/services/resultsService'
import { formatSubmissionDate } from '@/utils/formatDate'
import '@/styles/live-results.css'

function isLiveElection(e: ResultsElectionListItem): boolean {
  if (e.results_locked_at) return false
  if (!e.real_time_results) return false
  return new Date(e.end_date).getTime() > Date.now()
}

export function LiveResultsIndexView() {
  const [elections, setElections] = useState<ResultsElectionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchElectionsWithVisibleResults()
        if (!cancelled) setElections(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const refresh = window.setInterval(() => void load(), 30_000)
    return () => {
      cancelled = true
      window.clearInterval(refresh)
    }
  }, [])

  const liveCount = elections.filter(isLiveElection).length

  return (
    <div className="lr-root">
      <LiveResultsNav isLive={liveCount > 0} />

      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-orb1" />
        <div className="hero-orb2" />
        <div className="hero-orb3" />
        <div className="hero-inner">
          <div className="hero-top">
            <div className="hero-left">
              <div className="hero-badges">
                {liveCount > 0 ? (
                  <div className="hero-badge live">
                    <div className="bd" />
                    {liveCount} Live {liveCount === 1 ? 'Election' : 'Elections'}
                  </div>
                ) : null}
                <div className="hero-badge cat">📊 Public results</div>
              </div>
              <h1 className="hero-title">
                Live Election
                <br />
                Results
              </h1>
              <div className="hero-desc">
                Watch real-time tallies and certified outcomes for published elections. No account required.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="live-banner">
        <div className="lb-status">
          <div className="lb-dot" />
          Public results directory
        </div>
        <div className="lb-divider" />
        <div className="lb-item">
          Select an election below to open its live or final results dashboard.
        </div>
      </div>

      <div className="page">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--subtle)', padding: 48 }}>Loading results…</p>
        ) : error ? (
          <p style={{ textAlign: 'center', color: 'var(--danger)', padding: 48 }}>{error}</p>
        ) : elections.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--subtle)', padding: 48 }}>
            No public results are available yet.
          </p>
        ) : (
          <div className="rankings-list">
            {elections.map((e) => {
              const live = isLiveElection(e)
              return (
                <Link
                  key={e.id}
                  to={`/elections/${e.id}/results`}
                  className={`rank-card${live ? ' leader' : ''}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="rank-row">
                    <div className="rank-info" style={{ flex: 1 }}>
                      <div className="rank-name">
                        {e.title}
                        {live ? (
                          <span className="leader-badge" style={{ color: '#FCA5A5', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>
                            LIVE
                          </span>
                        ) : (
                          <span className="leader-badge">Results</span>
                        )}
                      </div>
                      <div className="rank-party">
                        {e.results_locked_at
                          ? 'Final results locked'
                          : live
                            ? 'Live counting'
                            : 'Results published'}{' '}
                        · Ends {formatSubmissionDate(e.end_date)}
                      </div>
                    </div>
                    <span className="p-btn primary" style={{ flexShrink: 0 }}>
                      View →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <LiveResultsFooter />
    </div>
  )
}
