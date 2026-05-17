import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { Footer } from '@/components/layout/Footer'
import { fetchElectionsWithVisibleResults, type ResultsElectionListItem } from '@/services/resultsService'
import { formatSubmissionDate } from '@/utils/formatDate'
import '@/styles/fortressvote-results-light.css'

function isLiveElection(e: ResultsElectionListItem): boolean {
  if (e.results_locked_at) return false
  if (!e.real_time_results) return false
  return new Date(e.end_date).getTime() > Date.now()
}

export function ResultsIndexPage() {
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

  return (
    <div className="fv-results-index">
      <TopNavBar />
      <div className="fv-results-index-inner" style={{ paddingTop: 24 }}>
        <Link to="/" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', marginBottom: 16, display: 'inline-block' }}>
          ← Back to home
        </Link>
        <h1>Live election results</h1>
        <p className="fv-index-sub">
          Watch real-time tallies and certified outcomes for published elections. No account required.
        </p>

        {loading ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>Loading…</p>
        ) : error ? (
          <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>
        ) : elections.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>No public results are available yet.</p>
        ) : (
          elections.map((e) => {
            const live = isLiveElection(e)
            return (
              <Link key={e.id} to={`/elections/${e.id}/results`} className="fv-election-row">
                <div>
                  {live ? (
                    <span className="fv-live-pill-sm">
                      <span className="fv-live-blink" style={{ width: 6, height: 6 }} />
                      LIVE
                    </span>
                  ) : null}
                  <h2>{e.title}</h2>
                  <p>
                    {e.results_locked_at
                      ? 'Final results locked'
                      : live
                        ? 'Live counting'
                        : 'Results published'}{' '}
                    · Ends {formatSubmissionDate(e.end_date)}
                  </p>
                </div>
                <span className="fv-view-btn">View</span>
              </Link>
            )
          })
        )}
      </div>
      <Footer />
    </div>
  )
}
