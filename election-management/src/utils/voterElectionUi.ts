import type { Election } from '@/types/election'
import type { VoterRegistrationWithElection } from '@/types/voterRegistration'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { isPollingOpen } from '@/utils/electionPolling'
import { isVotingWindowStarted } from '@/utils/autoFinalizeVoterRoll'

export type RegistrationUiPhase =
  | 'waitlisted'
  | 'pending_secret'
  | 'upcoming'
  | 'active_pending_vote'
  | 'can_vote'
  | 'voted'
  | 'completed'

function electionPick(reg: VoterRegistrationWithElection): Pick<
  Election,
  'start_date' | 'end_date' | 'status' | 'voter_roll_finalized_at'
> | null {
  if (!reg.election) return null
  return {
    start_date: reg.election.start_date,
    end_date: reg.election.end_date,
    status: reg.election.status as Election['status'],
    voter_roll_finalized_at: reg.election.voter_roll_finalized_at ?? null,
  }
}

export function getRegistrationPhase(
  reg: VoterRegistrationWithElection,
  nowMs = Date.now(),
): RegistrationUiPhase {
  if (reg.status === 'waitlisted') return 'waitlisted'

  const election = electionPick(reg)
  if (!election) return 'completed'

  const display = electionDisplayStatus(election.status, election.start_date, election.end_date, nowMs)

  if (reg.voted_at) {
    return display === 'completed' ? 'completed' : 'voted'
  }

  if (reg.status !== 'registered') return 'completed'

  if (!reg.election?.voter_roll_finalized_at || !reg.secret_voter_id) {
    if (
      display === 'active' ||
      election.status === 'active' ||
      isVotingWindowStarted({ status: election.status, start_date: election.start_date })
    ) {
      return 'pending_secret'
    }
  }

  if (!reg.secret_voter_id) return 'pending_secret'

  if (display === 'completed') return 'completed'

  if (display === 'upcoming') return 'upcoming'

  const open = isPollingOpen(election)
  if (open) return 'can_vote'

  if (display === 'active') return 'active_pending_vote'

  return 'completed'
}

export function registrationBadgeClass(phase: RegistrationUiPhase): string {
  switch (phase) {
    case 'waitlisted':
      return 'b-pending'
    case 'pending_secret':
      return 'b-pending'
    case 'upcoming':
      return 'b-upcoming'
    case 'active_pending_vote':
      return 'b-active'
    case 'can_vote':
      return 'b-active'
    case 'voted':
      return 'b-voted'
    case 'completed':
    default:
      return 'b-completed'
  }
}

/** Voting window started but roll/IDs not ready yet. */
export function shouldShowVotingPreparing(
  reg: VoterRegistrationWithElection,
  nowMs = Date.now(),
): boolean {
  if (!reg.election || reg.voted_at || reg.status !== 'registered') return false
  const { status, start_date, end_date } = reg.election
  const display = electionDisplayStatus(status, start_date, end_date, nowMs)
  if (display === 'completed' || nowMs > new Date(end_date).getTime()) return false
  if (display !== 'active' && status !== 'active' && !isVotingWindowStarted(reg.election)) {
    return false
  }
  return !reg.election.voter_roll_finalized_at || !reg.secret_voter_id
}

/** User may cast a ballot now (matches polling + registration gates; no full candidate load). */
export function canVote(reg: VoterRegistrationWithElection): boolean {
  const election = electionPick(reg)
  if (!election) return false
  if (!election.voter_roll_finalized_at) return false
  return (
    reg.status === 'registered' &&
    Boolean(reg.secret_voter_id) &&
    !reg.voted_at &&
    isPollingOpen(election)
  )
}

export function votingPreparingMessage(step?: string): string {
  switch (step) {
    case 'finalizing_roll':
      return 'Finalizing voter list…'
    case 'generating_ids':
      return 'Generating secret IDs…'
    case 'sending_emails':
      return 'Sending voter emails…'
    case 'checking':
      return 'Preparing voting…'
    default:
      return 'Your secret voter ID is being issued and emailed — please wait.'
  }
}

export function formatCountdown(endDateIso: string, nowMs = Date.now()): { h: string; m: string; s: string } {
  const ms = Math.max(0, new Date(endDateIso).getTime() - nowMs)
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  }
}
