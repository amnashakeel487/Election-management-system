import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchElectionResults, subscribeToElectionResults } from '@/services/resultsService'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { isPollingEnded } from '@/utils/electionPolling'

export function useElectionResults(electionId: string | undefined) {
  const [results, setResults] = useState<ElectionResultsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    if (!electionId) return

    try {
      const data = await fetchElectionResults(electionId)
      setResults(data)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }, [electionId])

  useEffect(() => {
    if (!electionId) return

    setLoading(true)
    void load()

    const unsubscribe = subscribeToElectionResults(electionId, () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void load()
      }, 400)
    })

    return () => {
      unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [electionId, load])

  const isLive =
    Boolean(results?.real_time_results) &&
    Boolean(results && !isPollingEnded({ end_date: results.end_date }))

  return { results, loading, error, lastUpdated, isLive, refresh: load }
}
