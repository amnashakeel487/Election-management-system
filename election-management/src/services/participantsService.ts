import { supabase } from '@/lib/supabase'
import type { CreatorParticipantRow, CreatorParticipantStats } from '@/types/creatorParticipants'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'

export async function fetchCreatorElectionParticipants(
  electionId: string,
): Promise<CreatorParticipantRow[]> {
  const { data, error } = await supabase.rpc('get_creator_election_participants', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return (data ?? []) as CreatorParticipantRow[]
}

export async function fetchCreatorParticipantStats(
  electionId: string,
  participants?: CreatorParticipantRow[],
): Promise<CreatorParticipantStats> {
  const base = await fetchElectionRegistrationStats(electionId)
  const rows =
    participants ?? (await fetchCreatorElectionParticipants(electionId).catch(() => [] as CreatorParticipantRow[]))

  const registered = rows.filter((r) => r.status === 'registered')
  const voted_count = registered.filter((r) => r.voted_at != null).length
  const turnout_percent =
    registered.length > 0 ? Math.round((voted_count / registered.length) * 1000) / 10 : 0

  return {
    registered_count: base.registered_count,
    waitlist_count: base.waitlist_count,
    max_voters: base.max_voters,
    voted_count,
    turnout_percent,
  }
}
