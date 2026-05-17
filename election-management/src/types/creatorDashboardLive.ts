export interface CreatorLiveElectionRow {
  election_id: string
  title: string
  end_date: string
  max_voters: number
  registered: number
  ballots_cast: number
  turnout_percent: number
}

export interface CreatorMonthlyVotePoint {
  label: string
  count: number
}

export interface CreatorDashboardLivePayload {
  live_elections: CreatorLiveElectionRow[]
  status_active: number
  status_upcoming: number
  status_completed: number
  status_draft: number
  monthly_votes: CreatorMonthlyVotePoint[]
}

export const EMPTY_CREATOR_DASHBOARD_LIVE: CreatorDashboardLivePayload = {
  live_elections: [],
  status_active: 0,
  status_upcoming: 0,
  status_completed: 0,
  status_draft: 0,
  monthly_votes: [],
}
