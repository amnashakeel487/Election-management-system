import { useEffect, useState } from 'react'
import { fetchAdminElections } from '@/services/adminDashboardService'
import { fetchElectionResults } from '@/services/resultsService'
import { ResultsExportToolbar } from '@/components/results/ResultsExportToolbar'
import type { ElectionResultsPayload } from '@/types/electionResults'

export function AdminElectionResultsExport() {
  const [elections, setElections] = useState<Array<{ id: string; title: string }>>([])
  const [electionId, setElectionId] = useState('')
  const [results, setResults] = useState<ElectionResultsPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    void fetchAdminElections()
      .then((rows) => {
        const list = rows.map((e) => ({ id: e.id, title: e.title }))
        setElections(list)
        if (list.length > 0) {
          setElectionId((prev) => prev || list[0]!.id)
        }
      })
      .catch(() => setLoadError('Could not load elections'))
  }, [])

  useEffect(() => {
    if (!electionId) {
      setResults(null)
      return
    }
    setLoading(true)
    setLoadError(null)
    void fetchElectionResults(electionId)
      .then(setResults)
      .catch((err) => {
        setResults(null)
        setLoadError(err instanceof Error ? err.message : 'Results unavailable for this election')
      })
      .finally(() => setLoading(false))
  }, [electionId])

  return (
    <div className="card-elevated" style={{ gridColumn: '1 / -1' }}>
      <div className="card-header">
        <div className="card-title">Election results export</div>
        <div className="card-subtitle">PDF, CSV, and print with charts &amp; turnout</div>
      </div>
      <div className="card-body">
        <div className="form-group">
          <label className="form-label" htmlFor="admin-results-election">
            Select election
          </label>
          <select
            id="admin-results-election"
            className="form-input form-select"
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
          >
            {elections.length === 0 ? (
              <option value="">No elections</option>
            ) : (
              elections.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))
            )}
          </select>
        </div>

        {loading ? (
          <p style={{ fontSize: 12, color: 'var(--subtle)' }}>Loading results…</p>
        ) : loadError ? (
          <p style={{ fontSize: 12, color: 'var(--danger)' }}>{loadError}</p>
        ) : results ? (
          <ResultsExportToolbar results={results} variant="admin" className="mt-3" />
        ) : (
          <p style={{ fontSize: 12, color: 'var(--subtle)' }}>Select an election with available results.</p>
        )}
      </div>
    </div>
  )
}
