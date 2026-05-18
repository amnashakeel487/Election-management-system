export interface VoteVerificationCandidateRow {
  candidate_id: string
  candidate_name: string
  designation: string | null
  vote_count: number
  proof_hashes: string[]
}

export interface VoteVerificationLedger {
  election_id: string
  candidates: VoteVerificationCandidateRow[]
  legacy_ballots_without_hash: number
  hash_algorithm: string
}
