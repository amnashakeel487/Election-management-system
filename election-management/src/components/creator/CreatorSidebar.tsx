import '@/styles/dashboard-votesecure.css'
import { VoteSecureSidebar } from '@/components/dashboard/VoteSecureSidebar'

export function CreatorSidebar({ electionCount = 0 }: { electionCount?: number }) {
  return (
    <div
      className="vs-dashboard"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'visible', background: 'transparent', minHeight: 0 }}
    >
      <VoteSecureSidebar role="creator" electionCount={electionCount} />
    </div>
  )
}
