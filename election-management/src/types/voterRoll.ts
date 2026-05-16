export interface FinalizedVoterRollEntry {
  registration_id: string
  user_id: string
  full_name: string
  email: string
  secret_voter_id: string | null
  registered_at: string
  secret_id_emailed_at: string | null
  voted_at: string | null
}

export interface FinalizedVoterRoll {
  election_id: string
  title: string
  finalized_at: string
  voter_count: number
  entries: FinalizedVoterRollEntry[]
}
