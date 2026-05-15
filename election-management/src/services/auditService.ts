import { supabase } from '@/lib/supabase'
import type { AuditAction } from '@/types/audit'
import type { AuditLogEntry } from '@/types/auth'

function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function logAuditEvent(
  action: AuditAction | string,
  details: Record<string, unknown> = {},
  options?: {
    targetUserId?: string
    electionId?: string
  },
): Promise<void> {
  const { error } = await supabase.rpc('log_audit_event', {
    p_action: action,
    p_details: details,
    p_target_user_id: options?.targetUserId ?? null,
    p_election_id: options?.electionId ?? null,
  })

  if (error) throw new Error(error.message)
}

export async function fetchRecentAuditLogs(limit = 12): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(
      `
      id,
      actor_id,
      target_user_id,
      election_id,
      action,
      details,
      created_at,
      actor:actor_id (email),
      target:target_user_id (email),
      election:election_id (title)
    `,
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    actor_id: row.actor_id,
    target_user_id: row.target_user_id,
    election_id: row.election_id,
    action: row.action,
    details: row.details as Record<string, unknown> | null,
    created_at: row.created_at,
    actor: normalizeJoin(row.actor as { email: string } | { email: string }[] | null),
    target: normalizeJoin(row.target as { email: string } | { email: string }[] | null),
    election: normalizeJoin(row.election as { title: string } | { title: string }[] | null),
  })) as AuditLogEntry[]
}
