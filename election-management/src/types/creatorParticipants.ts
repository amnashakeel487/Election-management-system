import type { VoterRegistrationStatus } from '@/types/voterRegistration'

export interface CreatorParticipantRow {
  registration_id: string
  user_id: string
  email: string
  full_name: string | null
  status: VoterRegistrationStatus | 'rejected'
  waitlist_position: number | null
  secret_voter_id: string | null
  secret_voter_id_assigned_at: string | null
  secret_voter_id_emailed_at: string | null
  voted_at: string | null
  created_at: string
}

export interface CreatorParticipantStats {
  registered_count: number
  voted_count: number
  waitlist_count: number
  turnout_percent: number
  max_voters: number
}

export type CreatorParticipantsTab = 'registered' | 'waitlist' | 'final'
