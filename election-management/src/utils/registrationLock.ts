import type { Election, RegistrationLockReason } from '@/types/election'

export function isRegistrationLocked(
  election: Pick<Election, 'registration_locked_at' | 'voter_roll_finalized_at'>,
): boolean {
  return Boolean(election.registration_locked_at || election.voter_roll_finalized_at)
}

export function registrationLockReasonLabel(reason: RegistrationLockReason | null | undefined): string {
  switch (reason) {
    case 'capacity':
      return 'Maximum voter capacity reached'
    case 'manual':
      return 'Organizer locked registration'
    case 'admin':
      return 'Locked by administrator'
    case 'finalized':
      return 'Voter roll finalized'
    default:
      return 'Registration closed'
  }
}

export function registrationStatusLabel(
  election: Pick<Election, 'voter_roll_finalized_at' | 'registration_locked_at' | 'registration_lock_reason'>,
): { label: string; tone: 'open' | 'locked' | 'finalized' } {
  if (election.voter_roll_finalized_at) {
    return { label: 'Voter roll finalized', tone: 'finalized' }
  }
  if (election.registration_locked_at) {
    return {
      label: `Registration locked — ${registrationLockReasonLabel(election.registration_lock_reason ?? undefined)}`,
      tone: 'locked',
    }
  }
  return { label: 'Registration open', tone: 'open' }
}
