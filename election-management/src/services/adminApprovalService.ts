import { supabase } from '@/lib/supabase'
import { logAuditEvent, fetchRecentAuditLogs as fetchAuditLogs } from '@/services/auditService'
import { AUDIT_ACTIONS } from '@/types/audit'
import type { PendingCreatorRequest } from '@/types/auth'

const USERS_TABLE = 'users'

export async function fetchPendingCreatorRequests(): Promise<PendingCreatorRequest[]> {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('id, email, full_name, phone, organization, election_purpose, created_at, approval_status')
    .eq('role', 'election_creator')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as PendingCreatorRequest[]
}

export async function fetchPendingCreatorCount(): Promise<number> {
  const { count, error } = await supabase
    .from(USERS_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('role', 'election_creator')
    .eq('approval_status', 'pending')

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function fetchRecentAuditLogs(limit = 12) {
  return fetchAuditLogs(limit)
}

export async function approveCreatorRequest(targetUserId: string, targetEmail: string): Promise<void> {
  const { error: updateError } = await supabase
    .from(USERS_TABLE)
    .update({
      approval_status: 'approved',
      role: 'election_creator',
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)
    .eq('role', 'election_creator')

  if (updateError) throw new Error(updateError.message)

  await logAuditEvent(
    AUDIT_ACTIONS.CREATOR_APPROVED,
    { approval_status: 'approved', target_email: targetEmail },
    { targetUserId },
  )
}

export async function rejectCreatorRequest(
  targetUserId: string,
  targetEmail: string,
  rejectionReason: string,
): Promise<void> {
  const { error: updateError } = await supabase
    .from(USERS_TABLE)
    .update({
      approval_status: 'rejected',
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)
    .eq('role', 'election_creator')

  if (updateError) throw new Error(updateError.message)

  await logAuditEvent(
    AUDIT_ACTIONS.CREATOR_REJECTED,
    { approval_status: 'rejected', target_email: targetEmail, rejection_reason: rejectionReason },
    { targetUserId },
  )
}
