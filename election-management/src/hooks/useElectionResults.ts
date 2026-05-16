import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchElectionResults, subscribeToElectionResults } from '@/services/resultsService'
import type { ElectionResultsPayload } from '@/types/electionResults'

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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [electionId, load])

  useEffect(() => {
    if (!electionId || !results?.is_live) return

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
  }, [electionId, results?.is_live, load])

  const isLive = Boolean(results?.is_live)
  const isLocked = Boolean(results?.results_locked_at)

  return {
    results,
    loading,
    error,
    lastUpdated,
    isLive,
    isLocked,
    refresh: load,
  }
}
