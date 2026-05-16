import type { Election } from '@/types/election'
import { VoterRegistrationPanel } from '@/components/voter/VoterRegistrationPanel'
import type { ElectionRegistrationStats, VoterRegistration } from '@/types/voterRegistration'

interface ElectionParticipationCardProps {
  electionId: string
  endDate: string
  stats: ElectionRegistrationStats
  userRegistration: VoterRegistration | null
  voterRollFinalized?: boolean
  canCastVote?: boolean
  onRegistrationChange: () => void
  className?: string
  /** Full election record — required for eligibility checks and deadline. */
  election?: Election
}

/**
 * @deprecated Prefer VoterRegistrationPanel with full `election` prop.
 * Thin wrapper for backward compatibility when only electionId is available.
 */
export function ElectionParticipationCard({
  election,
  electionId,
  endDate,
  stats,
  userRegistration,
  voterRollFinalized,
  canCastVote,
  onRegistrationChange,
  className,
}: ElectionParticipationCardProps) {
  if (!election) {
    throw new Error('ElectionParticipationCard requires `election` for voter registration.')
  }

  void electionId
  void endDate

  return (
    <VoterRegistrationPanel
      election={election}
      stats={stats}
      userRegistration={userRegistration}
      voterRollFinalized={voterRollFinalized}
      canCastVote={canCastVote}
      onRegistrationChange={onRegistrationChange}
      className={className}
    />
  )
}
