import type { ReactNode } from 'react'
import '@/styles/dashboard-votesecure.css'
import { VoteSecureSidebar, type DashboardRole } from './VoteSecureSidebar'

interface VoteSecureDashboardShellProps {
  role: DashboardRole
  pageTitle: string
  pageCrumb?: string
  pendingCount?: number
  electionCount?: number
  liveVoteCount?: number
  showSearch?: boolean
  topbarExtra?: ReactNode
  children: ReactNode
}

export function VoteSecureDashboardShell({
  role,
  pageTitle,
  pageCrumb,
  pendingCount,
  electionCount,
  liveVoteCount,
  showSearch = role === 'admin',
  topbarExtra,
  children,
}: VoteSecureDashboardShellProps) {
  return (
    <div className="vs-dashboard">
      <VoteSecureSidebar
        role={role}
        pendingCount={pendingCount}
        electionCount={electionCount}
        liveVoteCount={liveVoteCount}
      />
      <main className="vs-main">
        <header className="vs-topbar">
          <div>
            <div className="vs-page-title">{pageTitle}</div>
            {pageCrumb ? <div className="vs-page-crumb">{pageCrumb}</div> : null}
          </div>
          {showSearch ? (
            <div className="vs-topbar-search">
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="search" placeholder="Search elections, users, logs…" aria-label="Search dashboard" />
            </div>
          ) : null}
          <div className="vs-topbar-right">{topbarExtra}</div>
        </header>
        <div className="vs-content">{children}</div>
      </main>
    </div>
  )
}
