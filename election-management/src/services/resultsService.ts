import { supabase } from '@/lib/supabase'
import type { ElectionResultsPayload } from '@/types/electionResults'

export async function fetchElectionResults(electionId: string): Promise<ElectionResultsPayload> {
  const { data, error } = await supabase.rpc('get_election_results', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return data as ElectionResultsPayload
}

export function subscribeToElectionResults(
  electionId: string,
  onBallotInserted: () => void,
): () => void {
  const channel = supabase
    .channel(`election-results-${electionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'anonymous_ballots',
        filter: `election_id=eq.${electionId}`,
      },
      () => onBallotInserted(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export async function fetchElectionsWithVisibleResults(): Promise<
  { id: string; title: string; status: string; end_date: string; real_time_results: boolean }[]
> {
  const { data, error } = await supabase
    .from('elections')
    .select('id, title, status, end_date, real_time_results')
    .in('status', ['published', 'active', 'completed'])
    .order('end_date', { ascending: false })

  if (error) throw new Error(error.message)

  const now = Date.now()
  return (data ?? []).filter((e) => {
    if (e.real_time_results) return true
    if (e.status === 'completed') return true
    return new Date(e.end_date).getTime() <= now
  })
}
