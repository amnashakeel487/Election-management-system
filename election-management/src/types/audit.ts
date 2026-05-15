export const AUDIT_ACTIONS = {
  USER_LOGIN: 'user_login',
  VOTE_CAST: 'vote_cast',
  ELECTION_CREATED: 'election_created',
  ELECTION_UPDATED: 'election_updated',
  ELECTION_PUBLISHED: 'election_published',
  ELECTION_ACTIVATED: 'election_activated',
  ELECTION_VOTER_ROLL_FINALIZED: 'election_voter_roll_finalized',
  CREATOR_APPROVED: 'creator_approved',
  CREATOR_REJECTED: 'creator_rejected',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]
