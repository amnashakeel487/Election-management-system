import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchAdminElections,
  fetchPublishedElections,
  type ElectionWithCreator,
} from '@/services/adminDashboardService'
import { formatSubmissionDate } from '@/utils/formatDate'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-on-surface-variant/20 text-on-surface-variant',
  published: 'bg-primary/20 text-primary',
  active: 'bg-tertiary/20 text-tertiary',
  completed: 'bg-secondary/20 text-secondary',
  archived: 'bg-error/20 text-error',
}

type ElectionFilter = 'all' | 'published'

export function AdminElectionsPage() {
  const { profile } = useAuth()
  const { pendingCount } = useAdminApproval(profile?.id)
  const [elections, setElections] = useState<ElectionWithCreator[]>([])
  const [filter, setFilter] = useState<ElectionFilter>('published')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const load = filter === 'published' ? fetchPublishedElections : fetchAdminElections
    void load()
      .then(setElections)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load elections'))
      .finally(() => setLoading(false))
  }, [filter])

  const approvedCreatorElections = useMemo(
    () =>
      elections.filter(
        (e) => !e.creator || e.creator.approval_status === 'approved' || e.status !== 'draft',
      ),
    [elections],
  )

  const displayed = filter === 'published' ? approvedCreatorElections : elections

  return (
    <div className="text-on-surface">
      <AdminSidebar pendingCount={pendingCount} />
      <main className="ml-[280px] min-h-screen">
        <AdminTopBar title="Elections" />
        <div className="p-margin">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <Link to="/admin/dashboard" className="font-label-sm text-primary hover:underline">
              ← Back to dashboard
            </Link>
            <Link to="/admin/approvals" className="font-label-sm text-primary hover:underline">
              Creator approvals →
            </Link>
          </div>

          <p className="mt-2 font-body-sm text-on-surface-variant">
            Elections from approved creators. Published and active elections appear on the public landing page.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter('published')}
              className={
                filter === 'published'
                  ? 'rounded-lg bg-primary px-4 py-2 font-label-sm text-on-primary'
                  : 'rounded-lg border border-white/10 px-4 py-2 font-label-sm text-on-surface-variant'
              }
            >
              Approved / live elections
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={
                filter === 'all'
                  ? 'rounded-lg bg-primary px-4 py-2 font-label-sm text-on-primary'
                  : 'rounded-lg border border-white/10 px-4 py-2 font-label-sm text-on-surface-variant'
              }
            >
              All elections
            </button>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-error/30 bg-error-container/20 px-lg py-md text-error">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="mt-6 text-on-surface-variant">Loading elections…</p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-white/5 bg-surface-container">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-high/50 font-label-sm uppercase tracking-wider text-on-surface-variant">
                    <th className="px-lg py-4">Title</th>
                    <th className="px-lg py-4">Creator</th>
                    <th className="px-lg py-4">Status</th>
                    <th className="px-lg py-4">Dates</th>
                    <th className="px-lg py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-lg py-8 text-center text-on-surface-variant">
                        No elections in this view yet.
                      </td>
                    </tr>
                  ) : (
                    displayed.map((election) => (
                      <tr key={election.id} className="hover:bg-white/5">
                        <td className="px-lg py-4">
                          <p className="font-label-md text-on-surface">{election.title}</p>
                          {election.category ? (
                            <p className="text-[11px] text-on-surface-variant">{election.category}</p>
                          ) : null}
                        </td>
                        <td className="px-lg py-4 text-sm text-on-surface-variant">
                          <p>{election.creator?.full_name ?? '—'}</p>
                          <p className="text-[11px]">{election.creator?.email ?? '—'}</p>
                        </td>
                        <td className="px-lg py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${STATUS_STYLES[election.status] ?? ''}`}
                          >
                            {election.status}
                          </span>
                        </td>
                        <td className="px-lg py-4 text-sm text-on-surface-variant">
                          {formatSubmissionDate(election.start_date)} – {formatSubmissionDate(election.end_date)}
                        </td>
                        <td className="px-lg py-4 text-right">
                          <Link
                            to={`/elections/${election.id}`}
                            className="rounded-lg bg-primary/10 px-4 py-1.5 font-label-sm text-primary hover:bg-primary hover:text-on-primary"
                          >
                            View
                          </Link>
                          {(election.status === 'active' || election.status === 'completed') && (
                            <Link
                              to={`/elections/${election.id}/results`}
                              className="ml-2 rounded-lg border border-white/10 px-4 py-1.5 font-label-sm text-on-surface-variant hover:text-on-surface"
                            >
                              Results
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
