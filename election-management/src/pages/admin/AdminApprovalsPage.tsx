import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { CreatorReviewModal } from '@/components/admin/CreatorReviewModal'
import { PendingCreatorApprovalsTable } from '@/components/admin/PendingCreatorApprovalsTable'
import { RecentAuditActivity } from '@/components/admin/RecentAuditActivity'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import { useAuth } from '@/hooks/useAuth'
import type { PendingCreatorRequest } from '@/types/auth'
import { formatSubmissionDate } from '@/utils/formatDate'

type Tab = 'pending' | 'approved' | 'rejected'

export function AdminApprovalsPage() {
  const { profile } = useAuth()
  const {
    pendingCreators,
    approvedCreators,
    rejectedCreators,
    pendingCount,
    auditLogs,
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

  function closeReview() {
    setReviewing(null)
    clearNotice()
  }

  return (
    <div className="text-on-surface">
      <AdminSidebar pendingCount={pendingCount} />
      <main className="ml-[252px] min-h-screen">
        <AdminTopBar title="Creator Approvals" pendingCount={pendingCount} />

        <div className="space-y-gutter p-margin">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div>
              <Link to="/admin/dashboard" className="font-label-sm text-primary hover:underline">
                ← Dashboard
              </Link>
              <p className="mt-1 font-body-sm text-on-surface-variant">
                Review election creator applications, approve or reject with email notification.
              </p>
            </div>
            <Link
              to="/admin/elections"
              className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 font-label-md text-primary hover:bg-primary/20"
            >
              View approved elections →
            </Link>
          </div>

          {actionNotice ? (
            <p className="rounded-xl border border-tertiary/30 bg-tertiary/10 px-lg py-md font-body-sm text-on-surface">
              {actionNotice}
            </p>
          ) : null}
          {actionError ? (
            <p className="rounded-xl border border-error/30 bg-error-container/20 px-lg py-md font-body-sm text-error">
              {actionError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === 'pending'} count={pendingCount} onClick={() => setTab('pending')}>
              Pending requests
            </TabButton>
            <TabButton active={tab === 'approved'} count={approvedCreators.length} onClick={() => setTab('approved')}>
              Approved creators
            </TabButton>
            <TabButton active={tab === 'rejected'} count={rejectedCreators.length} onClick={() => setTab('rejected')}>
              Rejected
            </TabButton>
          </div>

          {loading ? (
            <p className="font-body-md text-on-surface-variant">Loading approval queue…</p>
          ) : tab === 'pending' ? (
            <div className="grid grid-cols-12 gap-gutter">
              <PendingCreatorApprovalsTable
                requests={pendingCreators}
                actingOnId={actingOnId}
                onReview={setReviewing}
                onApprove={(id, email) => void approve(id, email)}
                onReject={(id, email, reason) => void reject(id, email, reason)}
              />
              <RecentAuditActivity logs={auditLogs} />
            </div>
          ) : (
            <CreatorStatusList
              creators={tab === 'approved' ? approvedCreators : rejectedCreators}
              variant={tab === 'approved' ? 'approved' : 'rejected'}
            />
          )}
        </div>
      </main>

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
    </div>
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
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-lg bg-primary px-4 py-2 font-label-sm text-on-primary'
          : 'rounded-lg border border-line px-4 py-2 font-label-sm text-on-surface-variant hover:text-on-surface'
      }
    >
      {children} ({count})
    </button>
  )
}

function CreatorStatusList({
  creators,
  variant,
}: {
  creators: PendingCreatorRequest[]
  variant: 'approved' | 'rejected'
}) {
  if (creators.length === 0) {
    return (
      <p className="rounded-[24px] border border-line bg-surface-container px-lg py-8 text-center text-on-surface-variant">
        No {variant} creator applications yet.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-surface-container">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-surface-container-high/50 font-label-sm uppercase tracking-wider text-on-surface-variant">
            <th className="px-lg py-4">Name</th>
            <th className="px-lg py-4">Email / Phone</th>
            <th className="px-lg py-4">Organization</th>
            <th className="px-lg py-4">Purpose</th>
            {variant === 'rejected' ? <th className="px-lg py-4">Rejection reason</th> : null}
            <th className="px-lg py-4">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {creators.map((c) => (
            <tr key={c.id} className="hover:bg-elevated/40">
              <td className="px-lg py-4 text-on-surface">{c.full_name ?? '—'}</td>
              <td className="px-lg py-4 text-sm text-on-surface-variant">
                <div>{c.email}</div>
                <div className="text-[11px]">{c.phone ?? '—'}</div>
              </td>
              <td className="max-w-[140px] truncate px-lg py-4 text-sm text-on-surface-variant">
                {c.organization ?? '—'}
              </td>
              <td className="max-w-[200px] truncate px-lg py-4 text-sm text-on-surface-variant">
                {c.election_purpose ?? '—'}
              </td>
              {variant === 'rejected' ? (
                <td className="max-w-[200px] px-lg py-4 text-sm text-error">{c.rejection_reason ?? '—'}</td>
              ) : null}
              <td className="px-lg py-4 text-sm text-on-surface-variant">{formatSubmissionDate(c.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
