export interface CandidateResultRow {
  candidate_id: string
  name: string
  description: string | null
  designation?: string | null
  sort_order: number
  vote_count: number
}

export interface VoteTrendPoint {
  hour: string
  votes: number
}

export interface ElectionResultsPayload {
  election_id: string
  title: string
  status: string
  creator_id?: string
  total_votes: number
  registered_voters: number
  turnout_percent: number
  real_time_results: boolean
  start_date: string
  end_date: string
  results_locked_at: string | null
  polling_ended: boolean
  is_live: boolean
  candidates: CandidateResultRow[]
  vote_trend: VoteTrendPoint[]
  updated_at: string
}

export type WinnerOutcome =
  | { type: 'none' }
  | { type: 'winner'; candidate: CandidateResultRow; vote_count: number; share_percent: number }
  | { type: 'tie'; candidates: CandidateResultRow[]; vote_count: number }
