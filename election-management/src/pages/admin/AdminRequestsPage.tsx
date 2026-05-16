import { useState, type ReactNode } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { CreatorReviewModal } from '@/components/admin/CreatorReviewModal'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import { useAuth } from '@/hooks/useAuth'
import type { PendingCreatorRequest } from '@/types/auth'
import { adminApprovalBadgeClass, shortRequestCode } from '@/utils/adminDisplay'
import { avatarGradient, userInitials } from '@/utils/dashboardDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'

const meta = ADMIN_PAGE_META.requests

type Tab = 'pending' | 'approved' | 'rejected'

export function AdminRequestsPage() {
  const { profile } = useAuth()
  const {
    pendingCreators,
    approvedCreators,
    rejectedCreators,
    pendingCount,
    loading,
    actionError,
    actionNotice,
    actingOnId,
    approve,
    reject,
    clearNotice,
  } = useAdminApproval(profile?.id)

  const [tab, setTab] = useState<Tab>('pending')
  const [reviewing, setReviewing] = useState<PendingCreatorRequest | null>(null)

  const creators =
    tab === 'pending' ? pendingCreators : tab === 'approved' ? approvedCreators : rejectedCreators

  function closeReview() {
    setReviewing(null)
    clearNotice()
  }

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      {actionNotice ? <div className="alert alert-success">{actionNotice}</div> : null}
      {actionError ? <div className="alert alert-danger">{actionError}</div> : null}

      <div className="tabs">
        <TabButton active={tab === 'pending'} count={pendingCount} onClick={() => setTab('pending')}>
          Pending
        </TabButton>
        <TabButton active={tab === 'approved'} count={approvedCreators.length} onClick={() => setTab('approved')}>
          Approved
        </TabButton>
        <TabButton active={tab === 'rejected'} count={rejectedCreators.length} onClick={() => setTab('rejected')}>
          Rejected
        </TabButton>
      </div>

      {loading ? (
        <p style={{ color: 'var(--subtle)', fontSize: 13 }}>Loading approval queue…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Organization</th>
                <th>Purpose</th>
                {tab === 'rejected' ? <th>Reason</th> : null}
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {creators.length === 0 ? (
                <tr>
                  <td
                    colSpan={tab === 'rejected' ? 9 : 8}
                    className="muted"
                    style={{ textAlign: 'center', padding: 24 }}
                  >
                    No {tab} creator applications.
                  </td>
                </tr>
              ) : (
                creators.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="mono">{shortRequestCode(c.id, idx)}</td>
                    <td>
                      <div className="user-row">
                        <div className="user-avatar" style={{ background: avatarGradient(c.email) }}>
                          {userInitials(c.full_name, c.email)}
                        </div>
                        <div>
                          <div className="user-name">{c.full_name ?? '—'}</div>
                          <div className="user-email">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{c.phone ?? '—'}</td>
                    <td className="muted">{c.organization ?? '—'}</td>
                    <td className="muted" style={{ maxWidth: 180 }}>
                      {c.election_purpose ?? '—'}
                    </td>
                    {tab === 'rejected' ? (
                      <td className="muted" style={{ maxWidth: 160 }}>
                        {c.rejection_reason ?? '—'}
                      </td>
                    ) : null}
                    <td className="muted">{formatSubmissionDate(c.created_at)}</td>
                    <td>
                      <span
                        className={adminApprovalBadgeClass(
                          tab === 'pending' ? 'pending' : tab === 'approved' ? 'approved' : 'rejected',
                        )}
                      >
                        {tab}
                      </span>
                    </td>
                    <td>
                      <div className="td-actions">
                        {tab === 'pending' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-success btn-xs"
                              disabled={actingOnId === c.id}
                              onClick={() => void approve(c.id, c.email)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              disabled={actingOnId === c.id}
                              onClick={() => setReviewing(c)}
                            >
                              Reject
                            </button>
                            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setReviewing(c)}>
                              Review
                            </button>
                          </>
                        ) : (
                          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setReviewing(c)}>
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {reviewing ? (
        <CreatorReviewModal
          request={reviewing}
          acting={actingOnId === reviewing.id}
          onClose={closeReview}
          onApprove={() => {
            void approve(reviewing.id, reviewing.email).then(() => closeReview())
          }}
          onReject={(reason) => {
            void reject(reviewing.id, reviewing.email, reason).then(() => closeReview())
          }}
        />
      ) : null}
    </>
  )
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean
  count: number
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className={`tab-btn${active ? ' active' : ''}`} onClick={onClick}>
      {children}
      <span
        style={{
          background: active ? '#FEF9C3' : 'var(--border)',
          color: active ? '#CA8A04' : 'var(--subtle)',
          fontSize: 9,
          padding: '1px 6px',
          borderRadius: 10,
          marginLeft: 4,
        }}
      >
        {count}
      </span>
    </button>
  )
}
