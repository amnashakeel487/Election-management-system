import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { fetchElectionsWithVisibleResults } from '@/services/resultsService'
import { formatSubmissionDate } from '@/utils/formatDate'

import type { ResultsElectionListItem } from '@/services/resultsService'

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
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-on-background">
      <TopNavBar />
      <main className="mx-auto max-w-5xl px-margin pb-16 pt-24">
        <header className="mb-12">
          <h1 className="font-headline-xl text-headline-xl text-on-surface">Election Results</h1>
          <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">
            Live and final certified results for published elections.
          </p>
        </header>

        {loading ? (
          <p className="font-body-md text-on-surface-variant">Loading…</p>
        ) : error ? (
          <p className="font-body-md text-error">{error}</p>
        ) : elections.length === 0 ? (
          <p className="font-body-md text-on-surface-variant">No results are available yet.</p>
        ) : (
          <ul className="space-y-4">
            {elections.map((e) => (
              <li
                key={e.id}
                className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-[24px] p-6"
              >
                <div>
                  <p className="font-headline-md text-headline-md text-on-surface">{e.title}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {e.results_locked_at
                      ? 'Final results locked'
                      : e.real_time_results
                        ? 'Live counting enabled'
                        : 'Final results'}{' '}
                    · Ends {formatSubmissionDate(e.end_date)}
                  </p>
                </div>
                <Link
                  to={`/elections/${e.id}/results`}
                  className="rounded-xl bg-tertiary px-6 py-3 font-label-md text-label-md text-on-tertiary hover:opacity-90"
                >
                  View Results
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
