import type { UserRole } from '@/types/auth'
import { getDashboardPathForRole } from '@/utils/roleRoutes'

const ROLE_PREFIX: Record<UserRole, string> = {
  admin: '/admin',
  election_creator: '/creator',
  voter: '/voter',
}

/** After auth, return user to their dashboard route or a same-role path they tried to open. */
export function safeReturnPathForRole(path: string | undefined | null, role: UserRole): string {
  const fallback = getDashboardPathForRole(role)
  if (!path || typeof path !== 'string') return fallback
  if (!path.startsWith('/') || path.startsWith('//')) return fallback

  const prefix = ROLE_PREFIX[role]
  if (path === prefix || path.startsWith(`${prefix}/`)) {
    return path
  }
  return fallback
}
