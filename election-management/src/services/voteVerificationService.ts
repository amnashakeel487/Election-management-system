import { supabase } from '@/lib/supabase'
import type { VoteVerificationLedger } from '@/types/voteVerification'
import { parseOrThrow, secretVoterIdSchema } from '@/lib/validation/schemas'

export async function fetchVoteVerificationLedger(electionId: string): Promise<VoteVerificationLedger> {
  const { data, error } = await supabase.rpc('get_election_vote_verification_ledger', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return data as VoteVerificationLedger
}

export async function computeVoteProofHash(
  electionId: string,
  secretVoterId: string,
): Promise<string> {
  const normalized = parseOrThrow(secretVoterIdSchema, secretVoterId)
  const { data, error } = await supabase.rpc('compute_voter_vote_proof_hash', {
    p_election_id: electionId,
    p_secret_voter_id: normalized,
  })

  if (error) throw new Error(error.message)
  return String(data)
}
