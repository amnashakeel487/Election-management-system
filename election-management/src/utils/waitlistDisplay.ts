import type { VoterRegistrationStatus } from '@/types/voterRegistration'

/** Maps DB status to election_participants-style labels. */
export type ParticipantStatusLabel = 'approved' | 'waitlist' | 'rejected'

export function participantStatusLabel(status: VoterRegistrationStatus): ParticipantStatusLabel {
  switch (status) {
    case 'registered':
      return 'approved'
    case 'waitlisted':
      return 'waitlist'
    case 'rejected':
      return 'rejected'
    default:
      return 'waitlist'
  }
}

export function waitlistUserMessage(position: number | null | undefined): string {
  if (position == null || position < 1) {
    return 'You are on the waitlist.'
  }
  return `You are #${position} on the waitlist.`
}
