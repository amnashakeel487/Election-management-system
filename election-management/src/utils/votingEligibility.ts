import type { ElectionWithCandidates } from '@/types/election'
import type { VoterRegistration } from '@/types/voterRegistration'
import {
  getPollingPhase,
  isPollingOpen,
  msUntilPollingCloses,
  msUntilPollingOpens,
  pollingPhaseLabel,
} from '@/utils/electionPolling'
import { isPlausibleSecretVoterId } from '@/utils/secretVoterId'

export type VotingCheckId =
  | 'signed_in'
  | 'registered'
  | 'roll_finalized'
  | 'secret_id'
  | 'polling_window'
  | 'not_voted'

export interface VotingEligibilityCheck {
  id: VotingCheckId
  label: string
  passed: boolean
  detail?: string
}

export interface VotingEligibilityDetail {
  canVote: boolean
  pollingOpen: boolean
  phase: ReturnType<typeof getPollingPhase>
  checks: VotingEligibilityCheck[]
  blockReason: string | null
  closesInMs: number
  opensInMs: number
}

export function buildVotingEligibilityDetail(
  election: ElectionWithCandidates,
  registration: VoterRegistration | null,
  sessionUserId: string | undefined,
): VotingEligibilityDetail {
  const phase = getPollingPhase(election)
  const pollingOpen = isPollingOpen(election)
  const signedIn = Boolean(sessionUserId)
  const isRegistered = registration?.status === 'registered'
  const hasSecretId = Boolean(registration?.secret_voter_id)
  const notVoted = !registration?.voted_at
  const rollFinalized = Boolean(election.voter_roll_finalized_at)

  const checks: VotingEligibilityCheck[] = [
    {
      id: 'signed_in',
      label: 'Signed in',
      passed: signedIn,
      detail: signedIn ? undefined : 'Sign in to vote',
    },
    {
      id: 'registered',
      label: 'Registered for this election',
      passed: Boolean(registration && isRegistered),
      detail: !registration
        ? 'Join the election before voting'
        : !isRegistered
          ? 'Waitlisted voters cannot vote'
          : undefined,
    },
    {
      id: 'roll_finalized',
      label: 'Voter roll finalized',
      passed: rollFinalized,
      detail: rollFinalized ? undefined : 'Organizer must finalize the voter roll first',
    },
    {
      id: 'secret_id',
      label: 'Secret voter ID issued',
      passed: hasSecretId,
      detail: hasSecretId ? undefined : 'ID is emailed after roll finalization',
    },
    {
      id: 'polling_window',
      label: 'Within voting hours',
      passed: pollingOpen,
      detail: pollingOpen
        ? `Closes ${new Date(election.end_date).toLocaleString()}`
        : pollingPhaseLabel(phase),
    },
    {
      id: 'not_voted',
      label: 'Have not voted yet',
      passed: notVoted,
      detail: registration?.voted_at
        ? `You voted on ${new Date(registration.voted_at).toLocaleString()}`
        : undefined,
    },
  ]

  const canVote =
    signedIn && Boolean(registration && isRegistered) && rollFinalized && hasSecretId && pollingOpen && notVoted

  let blockReason: string | null = null
  if (!canVote) {
    const failed = checks.find((c) => !c.passed)
    blockReason = failed?.detail ?? failed?.label ?? 'Not eligible to vote'
  }

  return {
    canVote,
    pollingOpen,
    phase,
    checks,
    blockReason,
    closesInMs: msUntilPollingCloses(election),
    opensInMs: msUntilPollingOpens(election),
  }
}

export function validateSecretIdInput(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Enter your Secret Voter ID'
  if (!isPlausibleSecretVoterId(trimmed)) return 'Format should be like POLL-A-0001'
  return null
}
