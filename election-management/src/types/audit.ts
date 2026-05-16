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
  CREATOR_APPROVED: 'creator_approved',
  CREATOR_REJECTED: 'creator_rejected',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]
