import '@/styles/dashboard-votesecure.css'
import { VoteSecureSidebar } from '@/components/dashboard/VoteSecureSidebar'

export function AdminSidebar({ pendingCount = 0, electionCount = 0 }: { pendingCount?: number; electionCount?: number }) {
  return (
    <div
      className="vs-dashboard"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'visible', background: 'transparent', minHeight: 0 }}
    >
      <VoteSecureSidebar role="admin" pendingCount={pendingCount} electionCount={electionCount} />
    </div>
  )
}
