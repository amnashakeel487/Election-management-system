import { supabase } from '@/lib/supabase'
import { fetchPlatformStats } from '@/services/platformStatsService'
import type { Election } from '@/types/election'

export interface AdminDashboardStats {
  totalUsers: number
  activeElections: number
  totalVotes: number
  verifiedVoters: number
}

export interface AdminExtendedStats extends AdminDashboardStats {
  totalElections: number
  pendingApprovals: number
  creators: number
  voters: number
  admins: number
}

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  role: string
  approval_status: string | null
  created_at: string
}

export interface VoteActivityPoint {
  label: string
  count: number
}

export type VoteActivityRange = 1 | 7 | 30

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const extended = await fetchAdminExtendedStats()
  return {
    totalUsers: extended.totalUsers,
    activeElections: extended.activeElections,
    totalVotes: extended.totalVotes,
    verifiedVoters: extended.verifiedVoters,
  }
}

export async function fetchAdminExtendedStats(): Promise<AdminExtendedStats> {
  const [platform, usersRes, electionsRes, pendingRes] = await Promise.all([
    fetchPlatformStats(),
    supabase.from('users').select('role', { count: 'exact' }),
    supabase.from('elections').select('*', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'election_creator')
      .eq('approval_status', 'pending'),
  ])

  if (usersRes.error) throw new Error(usersRes.error.message)
  if (electionsRes.error) throw new Error(electionsRes.error.message)
  if (pendingRes.error) throw new Error(pendingRes.error.message)

  const rows = usersRes.data ?? []
  const creators = rows.filter((r) => r.role === 'election_creator').length
  const voters = rows.filter((r) => r.role === 'voter').length
  const admins = rows.filter((r) => r.role === 'admin').length
  const totalUsers = usersRes.count ?? rows.length

  return {
    totalUsers,
    activeElections: platform.active_elections,
    totalVotes: platform.total_votes,
    verifiedVoters: platform.verified_voters,
    totalElections: electionsRes.count ?? 0,
    pendingApprovals: pendingRes.count ?? 0,
    creators,
    voters,
    admins,
  }
}

export async function fetchVoterMonitoringStats(): Promise<{
  totalRegistrations: number
  waitlisted: number
  voted: number
  withSecretId: number
}> {
  const { data, error } = await supabase
    .from('voter_registrations')
    .select('status, secret_voter_id, voted_at')

  if (error) throw new Error(error.message)

  const rows = data ?? []
  return {
    totalRegistrations: rows.length,
    waitlisted: rows.filter((r) => r.status === 'waitlisted').length,
    voted: rows.filter((r) => r.voted_at != null).length,
    withSecretId: rows.filter((r) => r.secret_voter_id != null).length,
  }
}

export interface ElectionWithCreator extends Election {
  creator?: {
    email: string
    full_name: string | null
    approval_status: string | null
  } | null
}

export async function fetchAdminElections(): Promise<ElectionWithCreator[]> {
  const { data, error } = await supabase
    .from('elections')
    .select(
      `
      *,
      creator:creator_id (email, full_name, approval_status)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ElectionWithCreator[]
}

export async function fetchPublishedElections(): Promise<ElectionWithCreator[]> {
  const { data, error } = await supabase
    .from('elections')
    .select(
      `
      *,
      creator:creator_id (email, full_name, approval_status)
    `,
    )
    .in('status', ['published', 'active', 'completed'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ElectionWithCreator[]
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, approval_status, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AdminUserRow[]
}

export async function fetchVoteActivity(rangeDays: VoteActivityRange): Promise<VoteActivityPoint[]> {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - (rangeDays - 1))
  start.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('audit_logs')
    .select('created_at')
    .eq('action', 'vote_cast')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  if (error) throw new Error(error.message)

  const buckets = buildBuckets(rangeDays, start, end)
  for (const row of data ?? []) {
    const d = new Date(row.created_at as string)
    const key = bucketKey(d, rangeDays)
    const bucket = buckets.find((b) => b.key === key)
    if (bucket) bucket.count += 1
  }

  return buckets.map(({ label, count }) => ({ label, count }))
}

function buildBuckets(
  rangeDays: VoteActivityRange,
  start: Date,
  end: Date,
): { key: string; label: string; count: number }[] {
  const buckets: { key: string; label: string; count: number }[] = []
  const cursor = new Date(start)

  if (rangeDays === 1) {
    for (let h = 0; h < 24; h++) {
      const d = new Date(cursor)
      d.setHours(h, 0, 0, 0)
      if (d > end) break
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${h}`,
        label: d.toLocaleTimeString(undefined, { hour: 'numeric' }),
        count: 0,
      })
    }
    return buckets
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`
    const label =
      rangeDays <= 7
        ? dayNames[cursor.getDay()]
        : cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    buckets.push({ key, label, count: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  return buckets
}

function bucketKey(d: Date, rangeDays: VoteActivityRange): string {
  if (rangeDays === 1) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
  }
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export async function fetchSecuritySummary(): Promise<{
  auditEvents24h: number
  lastAuditAt: string | null
  voteCasts24h: number
}> {
  const since = new Date()
  since.setHours(since.getHours() - 24)

  const [auditRes, voteRes] = await Promise.all([
    supabase
      .from('audit_logs')
      .select('created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'vote_cast')
      .gte('created_at', since.toISOString()),
  ])

  if (auditRes.error) throw new Error(auditRes.error.message)
  if (voteRes.error) throw new Error(voteRes.error.message)

  const logs = auditRes.data ?? []
  return {
    auditEvents24h: logs.length,
    lastAuditAt: logs[0]?.created_at ?? null,
    voteCasts24h: voteRes.count ?? 0,
  }
}
