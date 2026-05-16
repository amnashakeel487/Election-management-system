import type { Election } from '@/types/election'
import type { UserProfile } from '@/types/auth'
import type { ElectionRegistrationStats, VoterRegistration } from '@/types/voterRegistration'
import { isRegistrationLocked, registrationLockReasonLabel } from '@/utils/registrationLock'

export type EligibilityCheckId =
  | 'signed_in'
  | 'voter_role'
  | 'account_approved'
  | 'election_open'
  | 'registration_open'
  | 'before_deadline'
  | 'not_duplicate'

export interface EligibilityCheck {
  id: EligibilityCheckId
  label: string
  passed: boolean
  detail?: string
}

export interface RegistrationEligibility {
  canRegister: boolean
  checks: EligibilityCheck[]
  registrationDeadline: string
  spotsRemaining: number
  willWaitlist: boolean
  blockReason: string | null
}

export function getRegistrationDeadline(election: Pick<Election, 'registration_deadline' | 'start_date'>): string {
  return election.registration_deadline ?? election.start_date
}

export function isBeforeRegistrationDeadline(
  election: Pick<Election, 'registration_deadline' | 'start_date'>,
  nowMs = Date.now(),
): boolean {
  return new Date(getRegistrationDeadline(election)).getTime() > nowMs
}

export function eligibilityRuleDescription(rule: string): string {
  switch (rule) {
    case 'verified_voters':
      return 'Verified FortressVote voters with an approved account'
    case 'organization_members':
      return 'Approved members of the hosting organization'
    case 'invite_only':
      return 'Invite-only (contact the election organizer)'
    default:
      return rule.replace(/_/g, ' ')
  }
}

export function buildRegistrationEligibility(params: {
  election: Election
  stats: ElectionRegistrationStats
  userRegistration: VoterRegistration | null
  sessionUserId: string | undefined
  profile: UserProfile | null | undefined
  nowMs?: number
}): RegistrationEligibility {
  const { election, stats, userRegistration, sessionUserId, profile } = params
  const nowMs = params.nowMs ?? Date.now()
  const deadlineIso = getRegistrationDeadline(election)
  const deadlineMs = new Date(deadlineIso).getTime()
  const electionOpen = ['published', 'active'].includes(election.status)
  const registrationOpen = electionOpen && !isRegistrationLocked(election)
  const beforeDeadline = deadlineMs > nowMs
  const signedIn = Boolean(sessionUserId)
  const voterRole = profile?.role === 'voter'
  const approved = profile?.approval_status === 'approved'
  const notDuplicate = !userRegistration
  const spotsRemaining = Math.max(0, stats.max_voters - stats.registered_count)
  const willWaitlist = spotsRemaining === 0 && registrationOpen && !election.voter_roll_finalized_at

  const checks: EligibilityCheck[] = [
    {
      id: 'signed_in',
      label: 'Signed in to FortressVote',
      passed: signedIn,
      detail: signedIn ? undefined : 'Sign in or create a voter account',
    },
    {
      id: 'voter_role',
      label: 'Voter account',
      passed: !signedIn || voterRole,
      detail:
        profile && profile.role !== 'voter'
          ? 'Switch to a voter account to join elections'
          : undefined,
    },
    {
      id: 'account_approved',
      label: 'Account approved',
      passed: !signedIn || approved,
      detail:
        profile?.approval_status === 'pending'
          ? 'Waiting for administrator approval'
          : profile?.approval_status === 'rejected'
            ? 'Account was not approved'
            : undefined,
    },
    {
      id: 'election_open',
      label: 'Election accepting registrations',
      passed: electionOpen,
      detail: electionOpen ? undefined : `Election status: ${election.status}`,
    },
    {
      id: 'registration_open',
      label: 'Registration not locked',
      passed: registrationOpen,
      detail: registrationOpen
        ? undefined
        : election.voter_roll_finalized_at
          ? 'Voter roll has been finalized — no new joins'
          : registrationLockReasonLabel(election.registration_lock_reason ?? undefined),
    },
    {
      id: 'before_deadline',
      label: 'Within registration deadline',
      passed: beforeDeadline,
      detail: beforeDeadline
        ? `Closes ${new Date(deadlineIso).toLocaleString()}`
        : 'Registration deadline has passed',
    },
    {
      id: 'not_duplicate',
      label: 'Not already registered',
      passed: notDuplicate,
      detail: userRegistration
        ? userRegistration.status === 'registered'
          ? 'You are already registered'
          : `On waitlist (#${userRegistration.waitlist_position})`
        : undefined,
    },
  ]

  const canRegister =
    signedIn &&
    voterRole &&
    approved &&
    electionOpen &&
    registrationOpen &&
    beforeDeadline &&
    notDuplicate

  let blockReason: string | null = null
  if (!canRegister) {
    const failed = checks.find((c) => !c.passed)
    blockReason = failed?.detail ?? failed?.label ?? 'Not eligible to register'
  }

  return {
    canRegister,
    checks,
    registrationDeadline: deadlineIso,
    spotsRemaining,
    willWaitlist,
    blockReason,
  }
}
