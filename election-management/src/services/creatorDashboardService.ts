import { supabase } from '@/lib/supabase'
import {
  EMPTY_CREATOR_DASHBOARD_STATS,
  type CreatorDashboardStats,
} from '@/types/creatorDashboard'

function parseStats(raw: unknown): CreatorDashboardStats {
  const o = (raw ?? {}) as Record<string, unknown>
  const num = (k: keyof CreatorDashboardStats) => Number(o[k]) || 0
  return {
    total_elections: num('total_elections'),
    active_elections: num('active_elections'),
    elections_created_30d: num('elections_created_30d'),
    total_participants: num('total_participants'),
    total_votes: num('total_votes'),
    votes_24h: num('votes_24h'),
    waitlist_count: num('waitlist_count'),
    registrations_7d: num('registrations_7d'),
    avg_turnout_percent: num('avg_turnout_percent'),
  }
}

export async function fetchCreatorDashboardStats(creatorId: string): Promise<CreatorDashboardStats> {
  const { data, error } = await supabase.rpc('get_creator_dashboard_stats', {
    p_creator_id: creatorId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return parseStats(data)
}

export async function fetchCreatorDashboardStatsSafe(creatorId: string): Promise<CreatorDashboardStats> {
  try {
    return await fetchCreatorDashboardStats(creatorId)
  } catch {
    return { ...EMPTY_CREATOR_DASHBOARD_STATS }
  }
}
