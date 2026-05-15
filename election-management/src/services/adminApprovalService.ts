import { supabase } from '@/lib/supabase'
import type { AuditLogEntry, PendingCreatorRequest } from '@/types/auth'

const USERS_TABLE = 'users'
const AUDIT_TABLE = 'audit_logs'

export async function fetchPendingCreatorRequests(): Promise<PendingCreatorRequest[]> {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('id, email, full_name, created_at, approval_status')
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

export async function fetchRecentAuditLogs(limit = 8): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .select('id, actor_id, target_user_id, action, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as AuditLogEntry[]
}

async function insertAuditLog(
  actorId: string,
  targetUserId: string,
  action: string,
  details: Record<string, unknown>,
) {
  const { error } = await supabase.from(AUDIT_TABLE).insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    details,
  })
  if (error) throw new Error(error.message)
}

export async function approveCreatorRequest(
  targetUserId: string,
  actorId: string,
  targetEmail: string,
): Promise<void> {
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

  await insertAuditLog(actorId, targetUserId, 'creator_approved', {
    approval_status: 'approved',
    target_email: targetEmail,
  })
}

export async function rejectCreatorRequest(
  targetUserId: string,
  actorId: string,
  targetEmail: string,
): Promise<void> {
  const { error: updateError } = await supabase
    .from(USERS_TABLE)
    .update({
      approval_status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)
    .eq('role', 'election_creator')

  if (updateError) throw new Error(updateError.message)

  await insertAuditLog(actorId, targetUserId, 'creator_rejected', {
    approval_status: 'rejected',
    target_email: targetEmail,
  })
}
