import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminSecurityPanel } from '@/components/admin/AdminSecurityPanel'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { PendingCreatorApprovalsTable } from '@/components/admin/PendingCreatorApprovalsTable'
import { RecentAuditActivity } from '@/components/admin/RecentAuditActivity'
import { VoteActivityChart } from '@/components/admin/VoteActivityChart'
import { useAuth } from '@/hooks/useAuth'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import {
  fetchAdminDashboardStats,
  type AdminDashboardStats,
} from '@/services/adminDashboardService'

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const {
    pendingCreators,
    pendingCount,
    auditLogs,
    loading,
    actionError,
    actionNotice,
    actingOnId,
    approve,
    reject,
  } = useAdminApproval(profile?.id)

  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    void fetchAdminDashboardStats()
      .then(setStats)
      .catch((err) => setStatsError(err instanceof Error ? err.message : 'Failed to load stats'))
      .finally(() => setStatsLoading(false))
  }, [])

  return (
    <div className="text-on-surface">
      <AdminSidebar pendingCount={pendingCount} />
      <main className="ml-[280px] min-h-screen">
        <AdminTopBar pendingCount={pendingCount} />

        <div className="space-y-gutter p-margin">
          {actionNotice ? (
            <p className="rounded-xl border border-tertiary/30 bg-tertiary/10 px-lg py-md font-body-sm text-on-surface">
              {actionNotice}
            </p>
          ) : null}
          {actionError || statsError ? (
            <p className="rounded-xl border border-error/30 bg-error-container/20 px-lg py-md font-body-sm text-body-sm text-error">
              {actionError ?? statsError}
            </p>
          ) : null}

          <AdminStatsGrid stats={stats} pendingCount={pendingCount} loading={statsLoading || loading} />

          <div className="grid grid-cols-12 gap-gutter">
            <VoteActivityChart />
            <AdminSecurityPanel />

            {loading ? (
              <p className="col-span-12 font-body-md text-on-surface-variant">Loading approvals and activity…</p>
            ) : (
              <>
                <PendingCreatorApprovalsTable
                  requests={pendingCreators}
                  actingOnId={actingOnId}
                  onApprove={(id, email) => void approve(id, email)}
                  onReject={(id, email, reason) => void reject(id, email, reason)}
                />
                <RecentAuditActivity logs={auditLogs} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
