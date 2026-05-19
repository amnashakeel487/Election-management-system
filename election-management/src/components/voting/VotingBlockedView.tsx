import { Link } from 'react-router-dom'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { formatCountdownMs } from '@/utils/electionPolling'

interface VotingBlockedViewProps {
  message: string | null
  electionId?: string
  opensInMs?: number | null
  /** When true, render inside voter dashboard layout (no duplicate top nav). */
  embedded?: boolean
}

function VotingBlockedContent({
  message,
  electionId,
  opensInMs,
  embedded,
}: VotingBlockedViewProps) {
  return (
    <>
      <span
        className="material-symbols-outlined text-5xl text-error"
        style={embedded ? { display: 'block', marginBottom: 12 } : undefined}
      >
        lock
      </span>
      <h1
        className={embedded ? undefined : 'font-headline-lg text-headline-lg text-on-surface'}
        style={
          embedded
            ? { fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }
            : undefined
        }
      >
        Ballot Locked
      </h1>
      <p
        className={embedded ? undefined : 'font-body-md text-body-md text-on-surface-variant'}
        style={
          embedded
            ? { fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }
            : undefined
        }
      >
        {message}
      </p>
      {opensInMs != null && opensInMs > 0 ? (
        <p
          className={embedded ? undefined : 'font-label-md text-label-md text-on-surface-variant'}
          style={embedded ? { fontSize: 13, color: 'var(--muted)', marginBottom: 12 } : undefined}
        >
          Voting opens in{' '}
          <span className={embedded ? undefined : 'font-mono text-primary'} style={embedded ? { fontWeight: 700 } : undefined}>
            {formatCountdownMs(opensInMs)}
          </span>
        </p>
      ) : null}
      {electionId ? (
        <Link
          to={embedded ? `/voter/elections/${electionId}` : `/elections/${electionId}`}
          className={embedded ? 'btn btn-ghost btn-sm' : 'text-primary hover:underline'}
          style={embedded ? { marginTop: 8 } : undefined}
        >
          Back to election
        </Link>
      ) : (
        <Link
          to="/voter/dashboard"
          className={embedded ? 'btn btn-ghost btn-sm' : 'text-primary hover:underline'}
          style={embedded ? { marginTop: 8 } : undefined}
        >
          Voter dashboard
        </Link>
      )}
    </>
  )
}

export function VotingBlockedView({ message, electionId, opensInMs, embedded = false }: VotingBlockedViewProps) {
  if (embedded) {
    return (
      <div className="card-elevated" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card-body" style={{ textAlign: 'center', padding: '28px 24px' }}>
          <VotingBlockedContent
            message={message}
            electionId={electionId}
            opensInMs={opensInMs}
            embedded
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <TopNavBar />
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-margin pt-16 text-center">
        <VotingBlockedContent message={message} electionId={electionId} opensInMs={opensInMs} />
      </main>
    </div>
  )
}
