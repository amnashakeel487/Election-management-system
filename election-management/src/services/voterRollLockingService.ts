import { supabase } from '@/lib/supabase'
import type { FinalizedVoterRoll } from '@/types/voterRoll'

export interface LockRegistrationResult {
  locked: boolean
  locked_at?: string
  reason?: string
  registered_count?: number
  already_locked?: boolean
}

export interface AdminOverrideLockResult {
  locked: boolean
  registered_count: number
  reason: string
}

export async function lockElectionRegistration(
  electionId: string,
  reason = 'manual',
): Promise<LockRegistrationResult> {
  const { data, error } = await supabase.rpc('lock_election_registration', {
    p_election_id: electionId,
    p_reason: reason,
  })

  if (error) throw new Error(error.message)
  return data as LockRegistrationResult
}

export async function adminOverrideRegistrationLock(
  electionId: string,
  locked: boolean,
  reason: string,
): Promise<AdminOverrideLockResult> {
  const { data, error } = await supabase.rpc('admin_override_registration_lock', {
    p_election_id: electionId,
    p_locked: locked,
    p_reason: reason,
  })

  if (error) throw new Error(error.message)
  return data as AdminOverrideLockResult
}

export async function fetchFinalizedVoterRoll(electionId: string): Promise<FinalizedVoterRoll> {
  const { data, error } = await supabase.rpc('get_finalized_voter_roll', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return data as FinalizedVoterRoll
}
