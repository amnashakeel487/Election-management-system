export interface CandidateResultRow {
  candidate_id: string
  name: string
  description: string | null
  sort_order: number
  vote_count: number
}

export interface ElectionResultsPayload {
  election_id: string
  title: string
  status: string
  total_votes: number
  real_time_results: boolean
  start_date: string
  end_date: string
  candidates: CandidateResultRow[]
  updated_at: string
}

export type WinnerOutcome =
  | { type: 'none' }
  | { type: 'winner'; candidate: CandidateResultRow; vote_count: number; share_percent: number }
  | { type: 'tie'; candidates: CandidateResultRow[]; vote_count: number }
