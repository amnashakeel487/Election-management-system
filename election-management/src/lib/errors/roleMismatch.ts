import type { UserRole } from '@/types/auth'

export class RoleMismatchError extends Error {
  readonly code = 'ROLE_MISMATCH' as const

  constructor(
    public readonly registeredRole: UserRole,
    public readonly attemptedRole: UserRole,
  ) {
    super('ROLE_MISMATCH')
    this.name = 'RoleMismatchError'
  }
}

export function isRoleMismatchError(err: unknown): err is RoleMismatchError {
  return err instanceof RoleMismatchError
}
