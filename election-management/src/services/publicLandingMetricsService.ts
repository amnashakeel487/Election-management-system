import { supabase } from '@/lib/supabase'

export type PublicLandingElectionMetric = {
  election_id: string
  ballots_cast: number
  registered: number
}

export async function fetchPublicLandingMetrics(): Promise<Map<string, PublicLandingElectionMetric>> {
  const { data, error } = await supabase.rpc('get_public_landing_election_metrics')

  if (error) throw new Error(error.message)

  const parsed = (Array.isArray(data) ? data : []) as PublicLandingElectionMetric[]

  const map = new Map<string, PublicLandingElectionMetric>()
  for (const row of parsed) {
    if (row?.election_id) {
      map.set(row.election_id, {
        election_id: row.election_id,
        ballots_cast: Number(row.ballots_cast) || 0,
        registered: Number(row.registered) || 0,
      })
    }
  }
  return map
}
