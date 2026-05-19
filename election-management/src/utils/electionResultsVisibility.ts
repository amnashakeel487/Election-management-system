import { isPollingEnded } from '@/utils/electionPolling'
import { formatSubmissionDate } from '@/utils/formatDate'

/** Election slice from voter registrations (Supabase returns status as string). */
export type ElectionResultsVisibilityInput = {
  status: string
  end_date: string
  real_time_results?: boolean | null
  results_locked_at?: string | null
  voter_roll_finalized_at?: string | null
}

/** Matches Supabase RPC `get_election_results` visibility rules. */
export function areElectionResultsVisible(election: ElectionResultsVisibilityInput): boolean {
  if (election.results_locked_at) return true
  if (election.real_time_results === true) return true
  if (election.status === 'completed' || election.status === 'archived') return true
  if (isPollingEnded(election)) return true
  return false
}

export function voterResultsActionLabel(election: ElectionResultsVisibilityInput): string {
  if (!areElectionResultsVisible(election)) return 'Results not published yet'
  const live =
    election.real_time_results === true &&
    !isPollingEnded(election) &&
    !election.results_locked_at &&
    (election.status === 'published' || election.status === 'active')
  return live ? 'View live results' : 'View results'
}

export function voterResultsUnavailableMessage(election: ElectionResultsVisibilityInput): string {
  if (areElectionResultsVisible(election)) return ''

  if (election.real_time_results !== true) {
    return `Live results are turned off for this election. Tallies will be available after voting ends on ${formatSubmissionDate(election.end_date)}, or when the organizer locks and publishes results.`
  }

  return 'Results are not available for this election yet.'
}
