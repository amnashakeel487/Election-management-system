import type { AuditLogEntry } from '@/types/auth'

export const AUDIT_ACTIONS = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_SIGNUP: 'user_signup',
  VOTE_CAST: 'vote_cast',
  ELECTION_CREATED: 'election_created',
  ELECTION_UPDATED: 'election_updated',
  ELECTION_PUBLISHED: 'election_published',
  ELECTION_ACTIVATED: 'election_activated',
  ELECTION_VOTER_ROLL_FINALIZED: 'election_voter_roll_finalized',
  ELECTION_REGISTRATION_LOCKED: 'election_registration_locked',
  ELECTION_REGISTRATION_UNLOCKED: 'election_registration_unlocked',
  CANDIDATE_CREATED: 'candidate_created',
  CANDIDATE_UPDATED: 'candidate_updated',
  RESULTS_LOCKED: 'results_locked',
  CREATOR_APPROVED: 'creator_approved',
  CREATOR_REJECTED: 'creator_rejected',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

export const AUDIT_CATEGORIES = ['all', 'login', 'vote', 'approval', 'edit', 'override'] as const

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number]

export interface AuditTransparencySummary {
  days: number
  since: string
  total_in_range: number
  total_24h: number
  logins: number
  votes: number
  approvals: number
  edits: number
  overrides: number
  last_event_at: string | null
  timeline: AuditTimelinePoint[]
}

export interface AuditTimelinePoint {
  day: string
  login: number
  vote: number
  approval: number
  edit: number
  override: number
}

export interface AuditLogsPage {
  total: number
  limit: number
  offset: number
  logs: AuditLogEntry[]
}
