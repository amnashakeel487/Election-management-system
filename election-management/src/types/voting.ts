export type VotingBlockCode =
  | 'not_registered'
  | 'not_eligible'
  | 'no_secret_id'
  | 'already_voted'
  | 'polling_closed'
  | 'invalid_secret_id'

export interface VerifySecretVoterResult {
  valid: boolean
  code?: VotingBlockCode
  message?: string
  registration_id?: string
  masked_secret_id?: string
  voted_at?: string
}

export interface CastVoteResult {
  success: boolean
  receipt_hash?: string
  cast_at?: string
}

export interface VotingEligibility {
  canVote: boolean
  pollingOpen: boolean
  hasVoted: boolean
  hasSecretId: boolean
  isRegistered: boolean
  reason?: string
}
