import { supabase } from '@/lib/supabase'
import type { Election } from '@/types/election'
import {
  EMPTY_CREATOR_DASHBOARD_LIVE,
  type CreatorDashboardLivePayload,
  type CreatorLiveElectionRow,
  type CreatorMonthlyVotePoint,
} from '@/types/creatorDashboardLive'
import { fetchPublicLandingMetrics } from '@/services/publicLandingMetricsService'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'

function parseLivePayload(raw: unknown): CreatorDashboardLivePayload {
  const o = (raw ?? {}) as Record<string, unknown>
  const live = Array.isArray(o.live_elections) ? (o.live_elections as CreatorLiveElectionRow[]) : []
  const monthly = Array.isArray(o.monthly_votes) ? (o.monthly_votes as CreatorMonthlyVotePoint[]) : []
  return {
    live_elections: live,
    status_active: Number(o.status_active) || 0,
    status_upcoming: Number(o.status_upcoming) || 0,
    status_completed: Number(o.status_completed) || 0,
    status_draft: Number(o.status_draft) || 0,
    monthly_votes: monthly,
  }
}

export async function fetchCreatorDashboardLive(creatorId: string): Promise<CreatorDashboardLivePayload> {
  const { data, error } = await supabase.rpc('get_creator_dashboard_live', {
    p_creator_id: creatorId,
  })
  if (error) throw new Error(error.message)
  return parseLivePayload(data)
}

/** Client fallback when RPC is not deployed yet. */
export async function buildCreatorDashboardLiveFallback(
  elections: Election[],
): Promise<CreatorDashboardLivePayload> {
  const metrics = await fetchPublicLandingMetrics().catch(() => new Map())

  let active = 0
  let upcoming = 0
  let completed = 0
  let draft = 0

  const liveRows: CreatorLiveElectionRow[] = []

  for (const e of elections) {
    const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
    if (phase === 'draft') draft += 1
    else if (phase === 'completed') completed += 1
    else if (phase === 'upcoming') upcoming += 1
    else if (phase === 'active') {
      active += 1
      const row = metrics.get(e.id)
      const registered = row?.registered ?? 0
      const ballots_cast = row?.ballots_cast ?? 0
      const turnout_percent =
        e.max_voters > 0
          ? Math.min(100, Math.round((ballots_cast / e.max_voters) * 100))
          : registered > 0
            ? Math.min(100, Math.round((ballots_cast / registered) * 100))
            : 0
      liveRows.push({
        election_id: e.id,
        title: e.title,
        end_date: e.end_date,
        max_voters: e.max_voters,
        registered,
        ballots_cast,
        turnout_percent,
      })
    }
  }

  liveRows.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())

  return {
    live_elections: liveRows.slice(0, 6),
    status_active: active,
    status_upcoming: upcoming,
    status_completed: completed,
    status_draft: draft,
    monthly_votes: [],
  }
}

export async function fetchCreatorDashboardLiveSafe(
  creatorId: string,
  elections: Election[],
): Promise<CreatorDashboardLivePayload> {
  try {
    return await fetchCreatorDashboardLive(creatorId)
  } catch {
    try {
      return await buildCreatorDashboardLiveFallback(elections)
    } catch {
      return { ...EMPTY_CREATOR_DASHBOARD_LIVE }
    }
  }
}
