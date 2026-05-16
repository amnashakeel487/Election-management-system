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

/** Use via hook in components; this is for non-React callers with explicit t. */
export function waitlistUserMessage(
  position: number | null | undefined,
  t: (key: string, opts?: { position?: number }) => string,
): string {
  if (position == null || position < 1) {
    return t('positionUnknown')
  }
  return t('positionMessage', { position })
}
