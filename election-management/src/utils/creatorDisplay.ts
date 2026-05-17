import type { Election } from '@/types/election'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatElectionCode } from '@/utils/electionTime'

export function creatorPhaseBadge(election: Election): { className: string; label: string; live?: boolean } {
  const phase = electionDisplayStatus(election.status, election.start_date, election.end_date)
  switch (phase) {
    case 'active':
      return { className: 'badge b-active', label: 'Active', live: true }
    case 'upcoming':
      return { className: 'badge b-upcoming', label: 'Upcoming' }
    case 'completed':
      return { className: 'badge b-completed', label: 'Completed' }
    default:
      if (election.status === 'draft') return { className: 'badge b-draft', label: 'Draft' }
      return { className: 'badge b-draft', label: election.status }
  }
}

export function electionShortCode(id: string): string {
  return formatElectionCode(id)
}
