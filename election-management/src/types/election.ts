export type ElectionStatus = 'draft' | 'published' | 'active' | 'completed' | 'archived'

export interface Election {
  id: string
  creator_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  max_voters: number
  status: ElectionStatus
  eligibility_rule: string
  privacy_tier: string
  real_time_results: boolean
  allow_write_ins: boolean
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface Candidate {
  id: string
  election_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface ElectionWithCandidates extends Election {
  candidates: Candidate[]
}

export interface CreateElectionInput {
  title: string
  description?: string
  start_date: string
  end_date: string
  max_voters: number
  eligibility_rule?: string
  privacy_tier?: string
  real_time_results?: boolean
  allow_write_ins?: boolean
}

export type UpdateElectionInput = Partial<CreateElectionInput>

export interface CandidateInput {
  name: string
  description?: string
}
