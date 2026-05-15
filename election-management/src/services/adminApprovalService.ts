import { supabase } from '@/lib/supabase'
import { logAuditEvent, fetchRecentAuditLogs as fetchAuditLogs } from '@/services/auditService'
import { sendCreatorApprovalNotification } from '@/services/creatorNotificationService'
import { AUDIT_ACTIONS } from '@/types/audit'
import type { PendingCreatorRequest } from '@/types/auth'

export interface ApprovalActionResult {
  emailSent: boolean
  emailWarning?: string
}

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

export async function fetchApprovedCreators(): Promise<PendingCreatorRequest[]> {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('id, email, full_name, phone, organization, election_purpose, created_at, approval_status')
    .eq('role', 'election_creator')
    .eq('approval_status', 'approved')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as PendingCreatorRequest[]
}

export async function fetchRejectedCreators(): Promise<PendingCreatorRequest[]> {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(
      'id, email, full_name, phone, organization, election_purpose, created_at, approval_status, rejection_reason',
    )
    .eq('role', 'election_creator')
    .eq('approval_status', 'rejected')
    .order('updated_at', { ascending: false })

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

async function notifyCreator(
  targetUserId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string,
): Promise<ApprovalActionResult> {
  const result = await sendCreatorApprovalNotification(targetUserId, decision, rejectionReason)
  if (result.sent) return { emailSent: true }
  if (result.dev_mode) {
    return { emailSent: false, emailWarning: 'Email skipped (dev mode). Check edge function logs.' }
  }
  return {
    emailSent: false,
    emailWarning: result.error ?? result.message ?? 'Notification email could not be sent.',
  }
}

export async function approveCreatorRequest(
  targetUserId: string,
  targetEmail: string,
): Promise<ApprovalActionResult> {
  const { error: updateError } = await supabase
    .from(USERS_TABLE)
    .update({
      approval_status: 'approved',
      rejection_reason: null,
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

  return notifyCreator(targetUserId, 'approved')
}

export async function rejectCreatorRequest(
  targetUserId: string,
  targetEmail: string,
  rejectionReason: string,
): Promise<ApprovalActionResult> {
  const trimmedReason = rejectionReason.trim()
  if (trimmedReason.length < 10) {
    throw new Error('Rejection reason must be at least 10 characters.')
  }

  const { error: updateError } = await supabase
    .from(USERS_TABLE)
    .update({
      approval_status: 'rejected',
      rejection_reason: trimmedReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)
    .eq('role', 'election_creator')

  if (updateError) throw new Error(updateError.message)

  await logAuditEvent(
    AUDIT_ACTIONS.CREATOR_REJECTED,
    { approval_status: 'rejected', target_email: targetEmail, rejection_reason: trimmedReason },
    { targetUserId },
  )

  return notifyCreator(targetUserId, 'rejected', trimmedReason)
}
