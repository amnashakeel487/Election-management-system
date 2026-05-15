import { Link } from 'react-router-dom'
import { TopNavBar } from '@/components/layout/TopNavBar'

interface VotingBlockedViewProps {
  message: string | null
  electionId?: string
}

export function VotingBlockedView({ message, electionId }: VotingBlockedViewProps) {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <TopNavBar />
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-margin pt-16 text-center">
        <span className="material-symbols-outlined text-5xl text-error">lock</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Ballot Locked</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
        {electionId ? (
          <Link to={`/elections/${electionId}`} className="text-primary hover:underline">
            Back to election
          </Link>
        ) : (
          <Link to="/voter/dashboard" className="text-primary hover:underline">
            Voter dashboard
          </Link>
        )}
      </main>
    </div>
  )
}
