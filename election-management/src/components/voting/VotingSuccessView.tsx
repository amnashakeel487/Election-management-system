import { Link } from 'react-router-dom'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { formatProofHashDisplay } from '@/utils/voteProofHash'

interface VotingSuccessViewProps {
  receiptHash: string | null
  verificationHash?: string | null
  electionId?: string
}

export function VotingSuccessView({ receiptHash, verificationHash, electionId }: VotingSuccessViewProps) {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <TopNavBar />
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-margin pt-16 text-center">
        <span className="material-symbols-outlined text-5xl text-tertiary">verified</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Vote Submitted</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your ballot was encrypted and stored anonymously. Your identity is not linked to your choice.
        </p>
        {receiptHash ? (
          <p className="font-mono text-body-sm text-on-surface-variant">
            Receipt: <span className="text-tertiary">{receiptHash}</span>
          </p>
        ) : null}
        {verificationHash ? (
          <p className="font-mono text-body-sm text-on-surface-variant">
            Verification hash (save this to check results):{' '}
            <span className="text-tertiary" title={verificationHash}>
              {formatProofHashDisplay(verificationHash)}
            </span>
          </p>
        ) : null}
        {electionId && verificationHash ? (
          <p className="font-body-sm text-on-surface-variant">
            After voting ends, open results and use &ldquo;Find my vote&rdquo; with your secret ID to see this hash
            under your candidate.
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          {electionId ? (
            <Link
              to={`/elections/${electionId}`}
              className="rounded-xl border border-outline-variant px-lg py-md font-body-md text-on-surface"
            >
              Election details
            </Link>
          ) : null}
          <Link to="/voter/dashboard" className="rounded-xl bg-primary px-lg py-md font-body-md text-on-primary">
            Return to dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
