import type { ElectionStatus } from '@/types/election'

export type VoterRegistrationStatus = 'registered' | 'waitlisted' | 'rejected'

export interface VoterRegistration {
  id: string
  election_id: string
  user_id: string
  status: VoterRegistrationStatus
  waitlist_position: number | null
  secret_voter_id: string | null
  secret_voter_id_assigned_at: string | null
  secret_voter_id_emailed_at: string | null
  voted_at: string | null
  created_at: string
}

export interface ElectionRegistrationStats {
  registered_count: number
  waitlist_count: number
  max_voters: number
  participation_percent: number
}

export interface RegisterForElectionResult {
  duplicate: boolean
  status: VoterRegistrationStatus
  registration_id?: string
  waitlist_position?: number
  registered_count?: number
  max_voters?: number
  message?: string
}

export interface VoterRegistrationWithElection extends VoterRegistration {
  election?: {
    id: string
    title: string
    status: ElectionStatus
    start_date: string
    end_date: string
    voter_roll_finalized_at?: string | null
    secret_ids_generated?: boolean
    secret_voter_id_prefix?: string
    real_time_results?: boolean
    results_locked_at?: string | null
  }
}
