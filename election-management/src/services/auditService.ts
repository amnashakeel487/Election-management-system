import { supabase } from '@/lib/supabase'
import type {
  AuditAction,
  AuditCategory,
  AuditLogsPage,
  AuditTransparencySummary,
  AuditTimelinePoint,
} from '@/types/audit'
import type { AuditLogEntry } from '@/types/auth'

function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function mapAuditRow(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: row.id as string,
    actor_id: (row.actor_id as string | null) ?? null,
    target_user_id: (row.target_user_id as string | null) ?? null,
    election_id: (row.election_id as string | null) ?? null,
    action: row.action as string,
    details: (row.details as Record<string, unknown> | null) ?? null,
    created_at: row.created_at as string,
    actor: normalizeJoin(row.actor as { email: string } | { email: string }[] | null),
    target: normalizeJoin(row.target as { email: string } | { email: string }[] | null),
    election: normalizeJoin(row.election as { title: string } | { title: string }[] | null),
  }
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
  const page = await fetchFilteredAuditLogs({ limit, offset: 0 })
  return page.logs
}

export async function fetchAuditTransparencySummary(days = 30): Promise<AuditTransparencySummary> {
  const { data, error } = await supabase.rpc('get_audit_transparency_summary', {
    p_days: days,
  })

  if (error) throw new Error(error.message)

  const raw = (data ?? {}) as Record<string, unknown>
  return {
    days: Number(raw.days ?? days),
    since: String(raw.since ?? ''),
    total_in_range: Number(raw.total_in_range ?? 0),
    total_24h: Number(raw.total_24h ?? 0),
    logins: Number(raw.logins ?? 0),
    votes: Number(raw.votes ?? 0),
    approvals: Number(raw.approvals ?? 0),
    edits: Number(raw.edits ?? 0),
    overrides: Number(raw.overrides ?? 0),
    last_event_at: (raw.last_event_at as string | null) ?? null,
    timeline: ((raw.timeline as AuditTimelinePoint[]) ?? []).map((p) => ({
      day: p.day,
      login: Number(p.login ?? 0),
      vote: Number(p.vote ?? 0),
      approval: Number(p.approval ?? 0),
      edit: Number(p.edit ?? 0),
      override: Number(p.override ?? 0),
    })),
  }
}

export interface AuditLogFilters {
  category?: AuditCategory
  overrideOnly?: boolean
  from?: string
  to?: string
  limit?: number
  offset?: number
}

/** Audit logs for one election — creator of that election or admin. */
export async function fetchCreatorElectionAuditLogs(
  electionId: string,
  options?: { limit?: number; offset?: number },
): Promise<AuditLogsPage> {
  const { data, error } = await supabase.rpc('get_creator_election_audit_logs', {
    p_election_id: electionId,
    p_limit: options?.limit ?? 50,
    p_offset: options?.offset ?? 0,
  })

  if (error) throw new Error(error.message)

  const raw = (data ?? {}) as Record<string, unknown>
  const logs = ((raw.logs as Record<string, unknown>[]) ?? []).map(mapAuditRow)

  return {
    total: Number(raw.total ?? 0),
    limit: Number(raw.limit ?? options?.limit ?? 50),
    offset: Number(raw.offset ?? options?.offset ?? 0),
    logs,
  }
}

export async function fetchFilteredAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogsPage> {
  const category = filters.category && filters.category !== 'all' ? filters.category : null

  const { data, error } = await supabase.rpc('get_audit_logs_filtered', {
    p_category: category,
    p_override_only: filters.overrideOnly ?? false,
    p_from: filters.from ?? null,
    p_to: filters.to ?? null,
    p_limit: filters.limit ?? 100,
    p_offset: filters.offset ?? 0,
  })

  if (error) throw new Error(error.message)

  const raw = (data ?? {}) as Record<string, unknown>
  const logs = ((raw.logs as Record<string, unknown>[]) ?? []).map(mapAuditRow)

  return {
    total: Number(raw.total ?? 0),
    limit: Number(raw.limit ?? filters.limit ?? 100),
    offset: Number(raw.offset ?? filters.offset ?? 0),
    logs,
  }
}

export function auditLogsToCsv(logs: AuditLogEntry[]): string {
  const header = ['timestamp', 'action', 'category', 'actor', 'target', 'election', 'override', 'details']
  const rows = logs.map((log) => {
    const details = log.details ?? {}
    const category =
      log.action === 'user_login' || log.action === 'user_logout' || log.action === 'user_signup'
        ? 'login'
        : log.action === 'vote_cast'
          ? 'vote'
          : log.action === 'creator_approved' || log.action === 'creator_rejected'
            ? 'approval'
            : details.override === true
              ? 'override'
              : 'edit'
    return [
      log.created_at,
      log.action,
      category,
      log.actor?.email ?? '',
      log.target?.email ?? '',
      log.election?.title ?? '',
      details.override === true ? 'yes' : 'no',
      JSON.stringify(details),
    ]
  })
  return [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export function downloadAuditCsv(logs: AuditLogEntry[], filenamePrefix = 'fortressvote-audit'): void {
  const csv = auditLogsToCsv(logs)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
