import type { UserRole } from '@/types/auth'

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  election_creator: '/creator/dashboard',
  voter: '/voter/dashboard',
}

export function getDashboardPathForRole(role: UserRole): string {
  return ROLE_DASHBOARD_PATHS[role]
}
