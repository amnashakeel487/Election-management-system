export interface VoteVerificationCandidateRow {
  candidate_id: string
  candidate_name: string
  designation: string | null
  vote_count: number
  masked_secret_ids: string[]
}

export interface VoteVerificationLedger {
  election_id: string
  candidates: VoteVerificationCandidateRow[]
  legacy_ballots_without_mask: number
  mask_format: string
}
