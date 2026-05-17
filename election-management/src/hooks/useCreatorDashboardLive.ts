import { useCallback, useEffect, useState } from 'react'
import type { Election } from '@/types/election'
import { fetchCreatorDashboardLiveSafe } from '@/services/creatorDashboardLiveService'
import {
  EMPTY_CREATOR_DASHBOARD_LIVE,
  type CreatorDashboardLivePayload,
} from '@/types/creatorDashboardLive'

const LIVE_REFRESH_MS = 30_000

export function useCreatorDashboardLive(
  creatorId: string | undefined,
  elections: Election[],
  enabled: boolean,
) {
  const [live, setLive] = useState<CreatorDashboardLivePayload>(EMPTY_CREATOR_DASHBOARD_LIVE)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!creatorId || !enabled) {
      setLive(EMPTY_CREATOR_DASHBOARD_LIVE)
      setLoading(false)
      return
    }
    try {
      const data = await fetchCreatorDashboardLiveSafe(creatorId, elections)
      setLive(data)
    } finally {
      setLoading(false)
    }
  }, [creatorId, enabled, elections])

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

  return { live, loading, refresh }
}
