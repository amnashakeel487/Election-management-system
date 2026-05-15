import { supabase } from '@/lib/supabase'

export interface PlatformStats {
  total_votes: number
  active_elections: number
  verified_voters: number
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await supabase.rpc('get_platform_stats')
  if (error) throw new Error(error.message)
  const row = data as PlatformStats
  return {
    total_votes: row?.total_votes ?? 0,
    active_elections: row?.active_elections ?? 0,
    verified_voters: row?.verified_voters ?? 0,
  }
}
