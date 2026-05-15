import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import { useAuth } from '@/hooks/useAuth'
import { fetchAdminUsers, type AdminUserRow } from '@/services/adminDashboardService'
import { formatSubmissionDate } from '@/utils/formatDate'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  election_creator: 'Election Creator',
  voter: 'Voter',
}

export function AdminUsersPage() {
  const { profile } = useAuth()
  const { pendingCount, approve, actingOnId } = useAdminApproval(profile?.id)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending'>('all')

  useEffect(() => {
    void fetchAdminUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const displayed =
    filter === 'pending'
      ? users.filter((u) => u.role === 'election_creator' && u.approval_status === 'pending')
      : users

  async function reloadUsers() {
    const data = await fetchAdminUsers()
    setUsers(data)
  }

  return (
    <div className="text-on-surface">
      <AdminSidebar pendingCount={pendingCount} />
      <main className="ml-[280px] min-h-screen">
        <AdminTopBar title="Users" />
        <div className="p-margin">
          <Link to="/admin/dashboard" className="font-label-sm text-primary hover:underline">
            ← Back to dashboard
          </Link>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={
                filter === 'all'
                  ? 'rounded-lg bg-primary px-4 py-2 font-label-sm text-on-primary'
                  : 'rounded-lg border border-white/10 px-4 py-2 font-label-sm text-on-surface-variant'
              }
            >
              All users
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={
                filter === 'pending'
                  ? 'rounded-lg bg-primary px-4 py-2 font-label-sm text-on-primary'
                  : 'rounded-lg border border-white/10 px-4 py-2 font-label-sm text-on-surface-variant'
              }
            >
              Pending creators ({pendingCount})
            </button>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-error/30 px-lg py-md text-error">{error}</p>
          ) : null}

          {loading ? (
            <p className="mt-6 text-on-surface-variant">Loading users…</p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-white/5 bg-surface-container">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-high/50 font-label-sm uppercase tracking-wider text-on-surface-variant">
                    <th className="px-lg py-4">Name</th>
                    <th className="px-lg py-4">Email</th>
                    <th className="px-lg py-4">Role</th>
                    <th className="px-lg py-4">Status</th>
                    <th className="px-lg py-4">Joined</th>
                    {filter === 'pending' ? <th className="px-lg py-4 text-right">Action</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={filter === 'pending' ? 6 : 5} className="px-lg py-8 text-center text-on-surface-variant">
                        No users in this view.
                      </td>
                    </tr>
                  ) : (
                    displayed.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="px-lg py-4 text-on-surface">{user.full_name ?? '—'}</td>
                        <td className="px-lg py-4 text-on-surface-variant">{user.email}</td>
                        <td className="px-lg py-4">{ROLE_LABELS[user.role] ?? user.role}</td>
                        <td className="px-lg py-4 text-on-surface-variant">
                          {user.role === 'election_creator' ? (user.approval_status ?? '—') : '—'}
                        </td>
                        <td className="px-lg py-4 text-on-surface-variant">
                          {formatSubmissionDate(user.created_at)}
                        </td>
                        {filter === 'pending' && user.approval_status === 'pending' ? (
                          <td className="px-lg py-4 text-right">
                            <button
                              type="button"
                              disabled={actingOnId === user.id}
                              onClick={() => {
                                void approve(user.id, user.email).then(() => reloadUsers())
                              }}
                              className="rounded-lg bg-primary/10 px-4 py-1.5 font-label-sm text-primary hover:bg-primary hover:text-on-primary disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </td>
                        ) : filter === 'pending' ? (
                          <td />
                        ) : null}
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
