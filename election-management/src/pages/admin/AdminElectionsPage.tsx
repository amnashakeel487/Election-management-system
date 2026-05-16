import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { fetchAdminElections, type ElectionWithCreator } from '@/services/adminDashboardService'
import { adminElectionBadgeClass, shortElectionCode } from '@/utils/adminDisplay'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'

const meta = ADMIN_PAGE_META.elections

type StatusTab = 'all' | 'active' | 'upcoming' | 'completed' | 'draft'

export function AdminElectionsPage() {
  const [elections, setElections] = useState<ElectionWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    void fetchAdminElections()
      .then(setElections)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load elections'))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    let active = 0
    let upcoming = 0
    let completed = 0
    let draft = 0
    for (const e of elections) {
      const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
      if (phase === 'active') active++
      else if (phase === 'upcoming') upcoming++
      else if (phase === 'completed') completed++
      else if (phase === 'draft') draft++
    }
    return { all: elections.length, active, upcoming, completed, draft }
  }, [elections])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return elections.filter((e) => {
      const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
      if (tab !== 'all' && phase !== tab) return false
      if (!q) return true
      return (
        e.title.toLowerCase().includes(q) ||
        e.creator?.email?.toLowerCase().includes(q) ||
        shortElectionCode(e.id).toLowerCase().includes(q)
      )
    })
  }, [elections, tab, search])

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="tabs" style={{ marginBottom: 0 }}>
          {(
            [
              ['all', counts.all],
              ['active', counts.active],
              ['upcoming', counts.upcoming],
              ['completed', counts.completed],
              ['draft', counts.draft],
            ] as const
          ).map(([key, count]) => (
            <button
              key={key}
              type="button"
              className={`tab-btn${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
            </button>
          ))}
        </div>
        <div className="topbar-search" style={{ minWidth: 0 }}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="8" fill="none" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
          </svg>
          <input
            type="search"
            placeholder="Search elections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--subtle)', fontSize: 13 }}>Loading elections…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Election Title</th>
                <th>Creator</th>
                <th>Status</th>
                <th>Window</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    No elections match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
                  return (
                    <tr key={e.id}>
                      <td className="mono">{shortElectionCode(e.id)}</td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, maxWidth: 220 }}>{e.title}</div>
                        {e.category ? (
                          <div style={{ fontSize: 10, color: 'var(--subtle)' }}>{e.category}</div>
                        ) : null}
                      </td>
                      <td className="muted">
                        <div>{e.creator?.full_name ?? '—'}</div>
                        <div style={{ fontSize: 10 }}>{e.creator?.email ?? '—'}</div>
                      </td>
                      <td>
                        <span className={adminElectionBadgeClass(e.status, e.start_date, e.end_date)}>
                          {phase === 'active' ? <span className="badge-dot" /> : null}
                          {phase}
                        </span>
                      </td>
                      <td className="muted">
                        {formatSubmissionDate(e.start_date)} – {formatSubmissionDate(e.end_date)}
                      </td>
                      <td>
                        <div className="td-actions">
                          <Link to={`/admin/elections/${e.id}`} className="btn btn-ghost btn-xs">
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
