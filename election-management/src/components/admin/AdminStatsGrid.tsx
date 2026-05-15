interface AdminStatsGridProps {
  pendingCount: number
}

export function AdminStatsGrid({ pendingCount }: AdminStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
      <div className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-surface-container p-lg">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined">group</span>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant">Total Users</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline-xl text-headline-xl">—</span>
          <span className="flex items-center font-label-sm text-label-sm text-tertiary">
            <span className="material-symbols-outlined text-[14px]">trending_up</span> —
          </span>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-surface-container p-lg">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-secondary/10 blur-2xl transition-all group-hover:bg-secondary/20" />
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <span className="material-symbols-outlined">how_to_vote</span>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant">Active Elections</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline-xl text-headline-xl">—</span>
          <span className="flex items-center font-label-sm text-label-sm text-tertiary">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> Live
          </span>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-surface-container p-lg">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-tertiary/10 blur-2xl transition-all group-hover:bg-tertiary/20" />
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant">Pending Approvals</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline-xl text-headline-xl">{pendingCount}</span>
          {pendingCount > 0 ? (
            <span className="flex items-center font-label-sm text-label-sm text-error">
              <span className="material-symbols-outlined text-[14px]">priority_high</span> Urgent
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
