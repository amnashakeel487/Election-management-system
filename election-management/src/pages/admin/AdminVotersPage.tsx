import { useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { supabase } from '@/lib/supabase'
import { fetchVoterMonitoringStats } from '@/services/adminDashboardService'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'

const meta = ADMIN_PAGE_META.voters

interface WaitlistRow {
  election_id: string
  election_title: string
  count: number
}

export function AdminVotersPage() {
  const [stats, setStats] = useState<{
    totalRegistrations: number
    waitlisted: number
    voted: number
    withSecretId: number
  } | null>(null)
  const [waitlistGroups, setWaitlistGroups] = useState<WaitlistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([
      fetchVoterMonitoringStats(),
      supabase
        .from('voter_registrations')
        .select('election_id, election:election_id (id, title)')
        .eq('status', 'waitlisted'),
    ])
      .then(([s, wlRes]) => {
        setStats(s)
        if (wlRes.error) throw new Error(wlRes.error.message)
        const grouped = new Map<string, WaitlistRow>()
        for (const row of wlRes.data ?? []) {
          const eid = row.election_id as string
          const election = row.election as { id: string; title: string } | { id: string; title: string }[] | null
          const title = Array.isArray(election) ? election[0]?.title : election?.title
          const existing = grouped.get(eid)
          if (existing) existing.count += 1
          else grouped.set(eid, { election_id: eid, election_title: title ?? 'Unknown election', count: 1 })
        }
        setWaitlistGroups([...grouped.values()].sort((a, b) => b.count - a.count))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load voter data'))
      .finally(() => setLoading(false))
  }, [])

  const statCards = useMemo(
    () => [
      { label: 'Total Registrations', value: stats?.totalRegistrations ?? 0 },
      { label: 'Waitlisted', value: stats?.waitlisted ?? 0 },
      { label: 'Voted', value: stats?.voted ?? 0 },
      { label: 'Secret IDs Issued', value: stats?.withSecretId ?? 0 },
    ],
    [stats],
  )

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="stat-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-num">{loading ? '—' : formatDashboardNumber(card.value)}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card-elevated">
          <div className="card-header">
            <div>
              <div className="card-title">Waitlist by Election</div>
              <div className="card-subtitle">Voters waiting for a slot</div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <p style={{ color: 'var(--subtle)', fontSize: 12 }}>Loading…</p>
            ) : waitlistGroups.length === 0 ? (
              <p style={{ color: 'var(--subtle)', fontSize: 12 }}>No waitlisted registrations.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Election</th>
                      <th>Waitlisted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlistGroups.map((g) => (
                      <tr key={g.election_id}>
                        <td>{g.election_title}</td>
                        <td className="mono">{formatDashboardNumber(g.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Duplicate Detection</div>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              Duplicate voter detection is not configured for this environment. When enabled, suspected duplicate
              registrations will appear here for review.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
