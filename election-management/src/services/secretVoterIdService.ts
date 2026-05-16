import { supabase } from '@/lib/supabase'

export interface FinalizeVoterRollResult {
  election_id: string
  finalized_at: string
  assigned_count: number
  registered_count?: number
  assignments: Array<{
    registration_id: string
    user_id: string
    secret_voter_id: string
  }>
}

export interface SendSecretVoterIdsResult {
  sent: number
  pending: number
  errors: string[]
  dev_mode?: boolean
}

export async function finalizeElectionVoterRoll(electionId: string): Promise<FinalizeVoterRollResult> {
  const { data, error } = await supabase.rpc('finalize_election_voter_roll', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return data as FinalizeVoterRollResult
}

export async function sendSecretVoterIdEmails(electionId: string): Promise<SendSecretVoterIdsResult> {
  const { data, error } = await supabase.functions.invoke('send-secret-voter-ids', {
    body: { election_id: electionId },
  })

  if (error) throw new Error(error.message)

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: string }).error))
  }

  return data as SendSecretVoterIdsResult
}

export async function finalizeAndEmailSecretVoterIds(
  electionId: string,
): Promise<{ finalize: FinalizeVoterRollResult; email: SendSecretVoterIdsResult }> {
  const finalize = await finalizeElectionVoterRoll(electionId)
  const email = await sendSecretVoterIdEmails(electionId)
  return { finalize, email }
}
