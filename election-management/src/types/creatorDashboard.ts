export interface CreatorDashboardStats {
  total_elections: number
  active_elections: number
  elections_created_30d: number
  total_participants: number
  total_votes: number
  votes_24h: number
  waitlist_count: number
  registrations_7d: number
  avg_turnout_percent: number
}

export const EMPTY_CREATOR_DASHBOARD_STATS: CreatorDashboardStats = {
  total_elections: 0,
  active_elections: 0,
  elections_created_30d: 0,
  total_participants: 0,
  total_votes: 0,
  votes_24h: 0,
  waitlist_count: 0,
  registrations_7d: 0,
  avg_turnout_percent: 0,
}
