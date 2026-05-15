/** design/super_admin_dashboard (AdminDashboard alias) */
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { PendingCreatorApprovalsTable } from '@/components/admin/PendingCreatorApprovalsTable'
import { RecentAuditActivity } from '@/components/admin/RecentAuditActivity'
import { useAuth } from '@/hooks/useAuth'
import { useAdminApproval } from '@/hooks/useAdminApproval'

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const {
    pendingCreators,
    pendingCount,
    auditLogs,
    loading,
    actionError,
    actingOnId,
    approve,
    reject,
  } = useAdminApproval(profile?.id)

  return (
    <div className="text-on-surface">
      <AdminSidebar />
      <main className="ml-[280px] min-h-screen">
        <AdminTopBar />

        <div className="space-y-gutter p-margin">
          {actionError ? (
            <p className="rounded-xl border border-error/30 bg-error-container/20 px-lg py-md font-body-sm text-body-sm text-error">
              {actionError}
            </p>
          ) : null}

          {loading ? (
            <p className="font-body-md text-body-md text-on-surface-variant">Loading dashboard…</p>
          ) : (
            <>
              <AdminStatsGrid pendingCount={pendingCount} />

              <div className="grid grid-cols-12 gap-gutter">
                <div className="col-span-12 overflow-hidden rounded-[24px] border border-white/5 bg-surface-container p-lg lg:col-span-8">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Vote Activity Trends</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Aggregate participation across all live systems
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-white/5 bg-surface-container-high px-4 py-2 font-label-sm text-label-sm transition-all hover:bg-surface-container-highest"
                      >
                        1D
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-4 py-2 font-label-sm text-label-sm text-on-primary transition-all"
                      >
                        7D
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-white/5 bg-surface-container-high px-4 py-2 font-label-sm text-label-sm transition-all hover:bg-surface-container-highest"
                      >
                        30D
                      </button>
                    </div>
                  </div>
                  <div className="relative flex h-[300px] w-full items-end justify-between gap-4 overflow-hidden px-4">
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-20">
                      <div className="h-px w-full border-t border-white/20" />
                      <div className="h-px w-full border-t border-white/20" />
                      <div className="h-px w-full border-t border-white/20" />
                      <div className="h-px w-full border-t border-white/20" />
                    </div>
                    <div className="relative h-[40%] flex-1 rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" />
                    <div className="relative h-[60%] flex-1 rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" />
                    <div className="relative h-[55%] flex-1 rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" />
                    <div className="relative h-[85%] flex-1 rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" />
                    <div className="relative h-[70%] flex-1 rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" />
                    <div className="relative h-[95%] flex-1 rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" />
                    <div className="relative h-[80%] flex-1 rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" />
                  </div>
                  <div className="mt-4 flex justify-between px-4 font-label-sm text-label-sm text-on-surface-variant">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                <div className="col-span-12 space-y-gutter lg:col-span-4">
                  <div className="h-full rounded-[24px] border border-white/5 bg-surface-container p-lg">
                    <h3 className="mb-6 font-headline-md text-headline-md text-on-surface">Security Monitor</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container-low p-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-tertiary">shield</span>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface">Encryption Engine</p>
                            <p className="text-[10px] text-tertiary">Active • 4096-bit AES</p>
                          </div>
                        </div>
                        <div className="h-3 w-3 animate-pulse rounded-full bg-tertiary shadow-[0_0_8px_rgba(76,215,246,0.6)]" />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container-low p-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">hub</span>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface">Blockchain Node</p>
                            <p className="text-[10px] text-primary">Synced • 12 Nodes</p>
                          </div>
                        </div>
                        <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(173,198,255,0.6)]" />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container-low p-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-on-surface-variant">lan</span>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface">Load Balancer</p>
                            <p className="text-[10px] text-on-surface-variant">Nominal Traffic</p>
                          </div>
                        </div>
                        <div className="h-3 w-3 rounded-full bg-primary/40" />
                      </div>
                    </div>
                    <div className="mt-8 flex items-center gap-4 rounded-2xl border border-secondary/10 bg-secondary/5 p-4">
                      <div className="rounded-full bg-secondary/20 p-3 text-secondary">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          gpp_good
                        </span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-secondary">Threat Level: Low</p>
                        <p className="text-[11px] text-on-surface-variant">Last scan completed 4m ago.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <PendingCreatorApprovalsTable
                  requests={pendingCreators}
                  actingOnId={actingOnId}
                  onApprove={(id, email) => void approve(id, email)}
                  onReject={(id, email) => void reject(id, email)}
                />

                <RecentAuditActivity logs={auditLogs} />
              </div>
            </>
          )}
        </div>

        <footer className="mt-12 flex w-full flex-col items-center justify-between border-t border-white/5 bg-surface-container-lowest px-margin py-xl md:flex-row">
          <div className="mb-4 md:mb-0">
            <span className="font-label-md text-label-md font-bold text-on-surface">FortressVote Secure Systems</span>
            <p className="mt-1 text-[11px] uppercase tracking-tighter text-on-surface-variant">
              © 2024 FortressVote Secure Systems. All Rights Reserved.
            </p>
          </div>
          <div className="flex gap-8">
            <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
              Privacy Policy
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
              Terms of Service
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
              Security Audit
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
              Voter Rights
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
