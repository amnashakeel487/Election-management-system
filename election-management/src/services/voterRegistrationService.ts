import { supabase } from '@/lib/supabase'
import { sendWaitlistEmail } from '@/services/waitlistService'
import type {
  ElectionRegistrationStats,
  RegisterForElectionResult,
  VoterRegistration,
  VoterRegistrationWithElection,
} from '@/types/voterRegistration'

const TABLE = 'voter_registrations'

export async function fetchElectionRegistrationStats(
  electionId: string,
): Promise<ElectionRegistrationStats> {
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .select('max_voters')
    .eq('id', electionId)
    .single()

  if (electionError) throw new Error(electionError.message)

  const { data, error } = await supabase
    .from(TABLE)
    .select('status')
    .eq('election_id', electionId)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  const registered_count = rows.filter((r) => r.status === 'registered').length
  const waitlist_count = rows.filter((r) => r.status === 'waitlisted').length
  const max_voters = election.max_voters as number
  const participation_percent =
    max_voters > 0 ? Math.min(100, Math.round((registered_count / max_voters) * 1000) / 10) : 0

  return {
    registered_count,
    waitlist_count,
    max_voters,
    participation_percent,
  }
}

export async function fetchUserRegistrationForElection(
  electionId: string,
  userId: string,
): Promise<VoterRegistration | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id, election_id, user_id, status, waitlist_position, secret_voter_id, secret_voter_id_assigned_at, secret_voter_id_emailed_at, voted_at, created_at',
    )
    .eq('election_id', electionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as VoterRegistration | null
}

export async function registerForElection(electionId: string): Promise<RegisterForElectionResult> {
  const { data, error } = await supabase.rpc('register_for_election', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)

  const result = data as RegisterForElectionResult
  if (!result.duplicate && result.status === 'registered') {
    window.dispatchEvent(new CustomEvent('voter-inbox-refresh'))
  }
  if (!result.duplicate && result.status === 'waitlisted' && result.waitlist_position) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      void sendWaitlistEmail('waitlist_joined', user.id, electionId, result.waitlist_position).catch(
        () => undefined,
      )
    }
  }

  return result
}

export async function fetchUserRegistrations(userId: string): Promise<VoterRegistrationWithElection[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `
      id,
      election_id,
      user_id,
      status,
      waitlist_position,
      secret_voter_id,
      secret_voter_id_assigned_at,
      secret_voter_id_emailed_at,
      voted_at,
      created_at,
      election:election_id (id, title, status, start_date, end_date, voter_roll_finalized_at, secret_ids_generated, secret_voter_id_prefix, real_time_results, results_locked_at)
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const election = row.election
    const normalized =
      Array.isArray(election) ? election[0] : election

    return {
      id: row.id,
      election_id: row.election_id,
      user_id: row.user_id,
      status: row.status,
      waitlist_position: row.waitlist_position,
      secret_voter_id: row.secret_voter_id,
      secret_voter_id_assigned_at: row.secret_voter_id_assigned_at,
      secret_voter_id_emailed_at: row.secret_voter_id_emailed_at,
      voted_at: row.voted_at,
      created_at: row.created_at,
      election: normalized ?? undefined,
    }
  }) as VoterRegistrationWithElection[]
}
