import { electionDisplayStatus } from '@/utils/dashboardDisplay'

export function adminElectionBadgeClass(
  status: string,
  startDate: string,
  endDate: string,
): string {
  const phase = electionDisplayStatus(status, startDate, endDate)
  switch (phase) {
    case 'active':
      return 'badge badge-active'
    case 'upcoming':
      return 'badge badge-upcoming'
    case 'completed':
      return 'badge badge-completed'
    case 'draft':
      return 'badge badge-pending'
    default:
      return 'badge badge-pending'
  }
}

export function adminRoleBadgeClass(role: string): string {
  switch (role) {
    case 'admin':
      return 'badge badge-admin'
    case 'election_creator':
      return 'badge badge-creator'
    case 'voter':
      return 'badge badge-voter'
    default:
      return 'badge badge-pending'
  }
}

export function adminApprovalBadgeClass(status: string | null): string {
  switch (status) {
    case 'approved':
      return 'badge badge-approved'
    case 'rejected':
      return 'badge badge-rejected'
    case 'pending':
      return 'badge badge-pending'
    default:
      return 'badge badge-approved'
  }
}

export function shortElectionCode(id: string): string {
  return `E${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
}

export function shortRequestCode(id: string, index: number): string {
  const suffix = id.replace(/-/g, '').slice(-3).toUpperCase() || String(index + 1)
  return `REQ-${String(index + 1).padStart(3, '0')}-${suffix}`
}
