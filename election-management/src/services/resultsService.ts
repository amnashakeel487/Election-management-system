import { supabase } from '@/lib/supabase'
import { triggerWinnerNotification } from '@/services/notificationService'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { isPollingEnded } from '@/utils/electionPolling'

function normalizeResultsPayload(raw: ElectionResultsPayload): ElectionResultsPayload {
  const pollingEnded =
    raw.polling_ended ??
    isPollingEnded({ end_date: raw.end_date, status: raw.status as 'published' | 'active' | 'completed' })

  const isLive =
    raw.is_live ??
    Boolean(raw.real_time_results && !pollingEnded && !raw.results_locked_at)

  return {
    ...raw,
    registered_voters: raw.registered_voters ?? 0,
    turnout_percent: Number(raw.turnout_percent ?? 0),
    results_locked_at: raw.results_locked_at ?? null,
    polling_ended: pollingEnded,
    is_live: isLive,
    vote_trend: raw.vote_trend ?? [],
    candidates: raw.candidates ?? [],
  }
}

export async function fetchElectionResults(electionId: string): Promise<ElectionResultsPayload> {
  const { data, error } = await supabase.rpc('get_election_results', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return normalizeResultsPayload(data as ElectionResultsPayload)
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

export async function lockElectionResults(electionId: string): Promise<ElectionResultsPayload> {
  const { data, error } = await supabase.rpc('lock_election_results', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)

  const payload = normalizeResultsPayload(data as ElectionResultsPayload)
  void triggerWinnerNotification(electionId).catch(() => {
    /* winner emails are best-effort; admin can retry from Notifications */
  })
  return payload
}

export interface ResultsElectionListItem {
  id: string
  title: string
  status: string
  end_date: string
  real_time_results: boolean
  results_locked_at: string | null
}

export async function fetchElectionsWithVisibleResults(): Promise<ResultsElectionListItem[]> {
  const { data, error } = await supabase
    .from('elections')
    .select('id, title, status, end_date, real_time_results, results_locked_at')
    .in('status', ['published', 'active', 'completed'])
    .order('end_date', { ascending: false })

  if (error) throw new Error(error.message)

  const now = Date.now()
  return (data ?? []).filter((e) => {
    if (e.results_locked_at) return true
    if (e.real_time_results) return true
    if (e.status === 'completed') return true
    return new Date(e.end_date).getTime() <= now
  })
}
