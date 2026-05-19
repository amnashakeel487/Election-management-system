import type { ElectionWithCandidates } from '@/types/election'
import type { VoterRegistration } from '@/types/voterRegistration'
import {
  getPollingPhase,
  isPollingOpen,
  msUntilPollingCloses,
  msUntilPollingOpens,
  pollingPhaseLabel,
} from '@/utils/electionPolling'
import { formatSecretVoterId, isPlausibleSecretVoterId, normalizeSecretVoterIdPrefix } from '@/utils/secretVoterId'

export type VotingCheckId =
  | 'signed_in'
  | 'registered'
  | 'secret_id'
  | 'secret_id_emailed'
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
  const secretIdEmailed = Boolean(registration?.secret_voter_id_emailed_at)
  const notVoted = !registration?.voted_at

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
      id: 'secret_id',
      label: 'Secret voter ID issued',
      passed: hasSecretId,
      detail: hasSecretId ? undefined : 'Register for this election to receive your secret voter ID',
    },
    {
      id: 'secret_id_emailed',
      label: 'Secret voter ID emailed',
      passed: secretIdEmailed,
      detail: secretIdEmailed
        ? undefined
        : hasSecretId
          ? 'Check your email for your secret voter ID (resend may take a moment)'
          : 'Your ID will be emailed when you register',
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
    signedIn &&
    Boolean(registration && isRegistered) &&
    hasSecretId &&
    secretIdEmailed &&
    pollingOpen &&
    notVoted

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

export function validateSecretIdInput(value: string, pollPrefix?: string | null): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Enter your Secret Voter ID'
  if (!isPlausibleSecretVoterId(trimmed)) {
    const example = formatSecretVoterId(normalizeSecretVoterIdPrefix(pollPrefix ?? 'POLL-A'), 1)
    return `Format should be like ${example} (prefix, then four digits)`
  }
  return null
}
