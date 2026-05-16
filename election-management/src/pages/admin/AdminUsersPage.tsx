import { useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { fetchAdminUsers, type AdminUserRow } from '@/services/adminDashboardService'
import { adminApprovalBadgeClass, adminRoleBadgeClass } from '@/utils/adminDisplay'
import { avatarGradient, userInitials } from '@/utils/dashboardDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'

const meta = ADMIN_PAGE_META.users

type RoleTab = 'all' | 'admin' | 'election_creator' | 'voter'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  election_creator: 'Creator',
  voter: 'Voter',
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<RoleTab>('all')

  useEffect(() => {
    void fetchAdminUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    return {
      all: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      election_creator: users.filter((u) => u.role === 'election_creator').length,
      voter: users.filter((u) => u.role === 'voter').length,
    }
  }, [users])

  const displayed = useMemo(() => {
    if (tab === 'all') return users
    return users.filter((u) => u.role === tab)
  }, [users, tab])

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="tabs">
        {(['all', 'admin', 'election_creator', 'voter'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`tab-btn${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {key === 'all' ? 'All' : ROLE_LABELS[key]} ({counts[key]})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--subtle)', fontSize: 13 }}>Loading users…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Approval</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    No users in this view.
                  </td>
                </tr>
              ) : (
                displayed.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-row">
                        <div className="user-avatar" style={{ background: avatarGradient(user.email) }}>
                          {userInitials(user.full_name, user.email)}
                        </div>
                        <div className="user-name">{user.full_name ?? '—'}</div>
                      </div>
                    </td>
                    <td className="muted">{user.email}</td>
                    <td>
                      <span className={adminRoleBadgeClass(user.role)}>{ROLE_LABELS[user.role] ?? user.role}</span>
                    </td>
                    <td>
                      {user.role === 'election_creator' ? (
                        <span className={adminApprovalBadgeClass(user.approval_status)}>{user.approval_status ?? '—'}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="muted">{formatSubmissionDate(user.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
