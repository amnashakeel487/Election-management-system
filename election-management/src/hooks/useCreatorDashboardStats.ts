import { useCallback, useEffect, useState } from 'react'
import { fetchCreatorDashboardStats } from '@/services/creatorDashboardService'
import type { CreatorDashboardStats } from '@/types/creatorDashboard'
import { EMPTY_CREATOR_DASHBOARD_STATS } from '@/types/creatorDashboard'

const LIVE_REFRESH_MS = 45_000

export function useCreatorDashboardStats(creatorId: string | undefined, enabled: boolean) {
  const [stats, setStats] = useState<CreatorDashboardStats>(EMPTY_CREATOR_DASHBOARD_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!creatorId || !enabled) {
      setStats(EMPTY_CREATOR_DASHBOARD_STATS)
      setLoading(false)
      return
    }

    try {
      const next = await fetchCreatorDashboardStats(creatorId)
      setStats(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [creatorId, enabled])

  useEffect(() => {
    setLoading(true)
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!creatorId || !enabled) return

    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, LIVE_REFRESH_MS)

    return () => window.clearInterval(id)
  }, [creatorId, enabled, refresh])

  return { stats, loading, error, refresh }
}
