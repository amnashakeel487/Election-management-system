import { supabase } from '@/lib/supabase'
import { castVoteSchema, parseOrThrow, secretVoterIdSchema } from '@/lib/validation/schemas'
import type { CastVoteResult, VerifySecretVoterResult, VotingEligibility } from '@/types/voting'
import { isPollingEnded, isPollingNotStarted, isPollingOpen } from '@/utils/electionPolling'
import type { ElectionWithCandidates } from '@/types/election'
import type { VoterRegistration } from '@/types/voterRegistration'

const VERIFIED_SESSION_KEY = 'fv_vote_verified'

interface VerifiedSession {
  electionId: string
  maskedSecretId: string
  secretVoterId: string
  expiresAt: number
}

export function getVerifiedSession(electionId: string): VerifiedSession | null {
  try {
    const raw = sessionStorage.getItem(`${VERIFIED_SESSION_KEY}_${electionId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VerifiedSession
    if (parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(`${VERIFIED_SESSION_KEY}_${electionId}`)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function setVerifiedSession(
  electionId: string,
  maskedSecretId: string,
  secretVoterId: string,
  ttlMinutes = 15,
): void {
  const session: VerifiedSession = {
    electionId,
    maskedSecretId,
    secretVoterId: secretVoterId.trim(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  }
  sessionStorage.setItem(`${VERIFIED_SESSION_KEY}_${electionId}`, JSON.stringify(session))
}

export function clearVerifiedSession(electionId: string): void {
  sessionStorage.removeItem(`${VERIFIED_SESSION_KEY}_${electionId}`)
}

export function buildVotingEligibility(
  election: ElectionWithCandidates,
  registration: VoterRegistration | null,
): VotingEligibility {
  const pollingOpen = isPollingOpen(election)
  const hasVoted = Boolean(registration?.voted_at)
  const hasSecretId = Boolean(registration?.secret_voter_id)
  const isRegistered = registration?.status === 'registered'

  if (!registration) {
    return { canVote: false, pollingOpen, hasVoted, hasSecretId, isRegistered, reason: 'Not registered for this election' }
  }

  if (!isRegistered) {
    return { canVote: false, pollingOpen, hasVoted, hasSecretId, isRegistered, reason: 'Waitlisted voters cannot vote' }
  }

  if (!hasSecretId) {
    return { canVote: false, pollingOpen, hasVoted, hasSecretId, isRegistered, reason: 'Secret voter ID not issued yet' }
  }

  if (!election.voter_roll_finalized_at) {
    return { canVote: false, pollingOpen, hasVoted, hasSecretId, isRegistered, reason: 'Voter roll not finalized' }
  }

  if (hasVoted) {
    return { canVote: false, pollingOpen, hasVoted, hasSecretId, isRegistered, reason: 'You have already voted' }
  }

  if (isPollingNotStarted(election)) {
    return { canVote: false, pollingOpen, hasVoted, hasSecretId, isRegistered, reason: 'Voting has not opened yet' }
  }

  if (isPollingEnded(election)) {
    return { canVote: false, pollingOpen, hasVoted, hasSecretId, isRegistered, reason: 'Voting period has ended' }
  }

  if (!pollingOpen) {
    return { canVote: false, pollingOpen, hasVoted, hasSecretId, isRegistered, reason: 'Voting is closed' }
  }

  return { canVote: true, pollingOpen, hasVoted, hasSecretId, isRegistered }
}

export async function verifySecretVoterForVoting(
  electionId: string,
  secretVoterId: string,
): Promise<VerifySecretVoterResult> {
  const normalizedId = parseOrThrow(secretVoterIdSchema, secretVoterId)
  const { data, error } = await supabase.rpc('verify_secret_voter_for_voting', {
    p_election_id: electionId,
    p_secret_voter_id: normalizedId,
  })

  if (error) throw new Error(error.message)
  return data as VerifySecretVoterResult
}

export interface ElectionVotingStatus {
  election_id: string
  status: string
  voter_roll_finalized_at: string | null
  start_date: string
  end_date: string
  polling_open: boolean
  phase: 'not_finalized' | 'not_started' | 'open' | 'ended' | 'closed'
}

export async function fetchElectionVotingStatus(electionId: string): Promise<ElectionVotingStatus> {
  const { data, error } = await supabase.rpc('get_election_voting_status', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return data as ElectionVotingStatus
}

/** When voting window has started, auto-finalize roll and email secret IDs if needed. */
export async function ensureElectionVotingReady(electionId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) return

  const { error } = await supabase.functions.invoke('ensure-election-voting-ready', {
    body: { election_id: electionId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) {
    console.warn('ensure-election-voting-ready:', error.message)
  }
}

export async function castAnonymousVote(
  electionId: string,
  secretVoterId: string,
  candidateId: string,
): Promise<CastVoteResult> {
  const validated = parseOrThrow(castVoteSchema, {
    electionId,
    secretVoterId,
    candidateId,
  })
  const { data, error } = await supabase.rpc('cast_anonymous_vote', {
    p_election_id: validated.electionId,
    p_secret_voter_id: validated.secretVoterId,
    p_candidate_id: validated.candidateId,
  })

  if (error) throw new Error(error.message)
  return data as CastVoteResult
}
