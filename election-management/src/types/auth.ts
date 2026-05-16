export type UserRole = 'admin' | 'election_creator' | 'voter'

/** Roles available on the public registration form (Super Admin is provisioned separately). */
export type RegisterableRole = Exclude<UserRole, 'admin'>

export const REGISTERABLE_ROLES: RegisterableRole[] = ['voter', 'election_creator']

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Super Admin',
  election_creator: 'Election Creator',
  voter: 'Voter',
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  approval_status: ApprovalStatus
  full_name: string | null
  phone: string | null
  organization: string | null
  election_purpose: string | null
  rejection_reason: string | null
  theme_preference?: string | null
  locale_preference?: string | null
  created_at: string
  updated_at: string
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignUpPayload extends AuthCredentials {
  role: RegisterableRole
  full_name: string
  phone: string
  organization?: string
  election_purpose?: string
}

export interface AuditLogEntry {
  id: string
  actor_id: string | null
  target_user_id: string | null
  election_id: string | null
  action: string
  details: Record<string, unknown> | null
  created_at: string
  actor?: { email: string } | null
  target?: { email: string } | null
  election?: { title: string } | null
}

export interface PendingCreatorRequest {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  organization: string | null
  election_purpose: string | null
  rejection_reason?: string | null
  created_at: string
  approval_status: ApprovalStatus
}
