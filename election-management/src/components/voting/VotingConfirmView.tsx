import { Link } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { VOTING_CANDIDATE_IMAGES } from '@/constants/votingAssets'
import type { Candidate, ElectionWithCandidates } from '@/types/election'
import { candidatePortraitOrPlaceholder } from '@/utils/candidateDisplay'
import { formatElectionCode } from '@/utils/electionTime'
import { formatCountdownMs } from '@/utils/electionPolling'

interface VotingConfirmViewProps {
  election: ElectionWithCandidates
  electionId: string
  candidate: Candidate
  maskedId: string | null
  timeLeftMs: number
  submitting: boolean
  error: string | null
  onBack: () => void
  onConfirm: () => void
}

export function VotingConfirmView({
  election,
  electionId,
  candidate,
  maskedId,
  timeLeftMs,
  submitting,
  error,
  onBack,
  onConfirm,
}: VotingConfirmViewProps) {
  return (
    <div className="min-h-screen bg-background font-body-md text-on-background">
      <TopNavBar />
      <main className="mx-auto max-w-2xl px-margin pb-16 pt-24">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {formatElectionCode(electionId)} · {election.title}
          </span>
          <span className="font-label-md text-label-md tabular-nums text-error">
            Closes {formatCountdownMs(timeLeftMs)}
          </span>
        </div>

        <h1 className="mb-2 font-headline-xl text-headline-xl text-on-surface">Confirm your vote</h1>
        <p className="mb-8 font-body-md text-body-md text-on-surface-variant">
          Review your selection. After you confirm, your ballot is encrypted and stored anonymously. This cannot be
          undone.
        </p>

        <div className="glass-panel mb-8 rounded-[32px] p-8">
          <p className="mb-4 font-label-md text-label-md uppercase tracking-widest text-primary">Your selection</p>
          <div className="flex items-center gap-4">
            <img
              src={candidatePortraitOrPlaceholder(candidate, VOTING_CANDIDATE_IMAGES)}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">{candidate.name}</h2>
              <p className="font-label-sm text-label-sm text-primary">
                {candidate.designation?.trim() || 'Candidate'}
              </p>
            </div>
          </div>
        </div>

        <ul className="mb-8 space-y-3 rounded-2xl border border-line bg-surface-container-low p-6 font-body-sm text-body-sm">
          <li className="flex justify-between text-on-surface-variant">
            <span>Voter ID (masked)</span>
            <span className="font-mono text-on-surface">{maskedId ?? '****'}</span>
          </li>
          <li className="flex justify-between text-on-surface-variant">
            <span>Ballot type</span>
            <span className="text-tertiary">Anonymous · one vote per voter</span>
          </li>
        </ul>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <span className="material-symbols-outlined text-primary">visibility_off</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Your account is only used to ensure you vote once. Your candidate choice is not stored with your profile.
          </p>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-error/20 bg-error-container/20 px-4 py-3 font-body-sm text-error">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="w-full rounded-xl bg-primary py-4 font-headline-md text-headline-md text-on-primary disabled:opacity-60"
          >
            {submitting ? 'Submitting ballot…' : 'Confirm and submit vote'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onBack}
            className="w-full rounded-xl border border-outline-variant py-4 font-label-md text-label-md text-on-surface-variant"
          >
            Back to ballot
          </button>
          <Link
            to={`/elections/${electionId}`}
            className="py-2 text-center font-label-sm text-label-sm text-primary hover:underline"
          >
            Exit without voting
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
