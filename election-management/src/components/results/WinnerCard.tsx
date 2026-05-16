import type { WinnerOutcome } from '@/types/electionResults'

interface WinnerCardProps {
  outcome: WinnerOutcome
  totalVotes: number
  electionEnded: boolean
  resultsLocked?: boolean
}

export function WinnerCard({ outcome, totalVotes, electionEnded, resultsLocked }: WinnerCardProps) {
  if (outcome.type === 'none') {
    return (
      <div className="glass-panel rounded-[24px] border border-line p-8 text-center">
        <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant">hourglass_empty</span>
        <p className="font-headline-md text-headline-md text-on-surface">Awaiting Votes</p>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Results will update in real time as ballots are cast.
        </p>
      </div>
    )
  }

  if (outcome.type === 'tie') {
    return (
      <div className="glass-panel rounded-[24px] border border-secondary/30 bg-secondary/10 p-8">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-4xl text-secondary">balance</span>
          <div>
            <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">Tie Detected</p>
            <h3 className="mt-1 font-headline-lg text-headline-lg text-on-surface">
              {outcome.candidates.map((c) => c.name).join(' vs ')}
            </h3>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              Each leading candidate has {outcome.vote_count.toLocaleString()} votes (
              {totalVotes > 0 ? Math.round((outcome.vote_count / totalVotes) * 1000) / 10 : 0}%).
              {electionEnded ? ' Final audit may be required.' : ' Counts are still updating.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-[24px] border border-tertiary/30 bg-tertiary/10 p-8">
      <div className="flex items-start gap-4">
        <span className="material-symbols-outlined text-4xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
          emoji_events
        </span>
        <div>
          <p className="font-label-md text-label-md uppercase tracking-widest text-tertiary">
            {resultsLocked ? 'Declared Winner' : electionEnded ? 'Certified Winner' : 'Current Leader'}
          </p>
          <h3 className="mt-1 font-headline-lg text-headline-lg text-on-surface">{outcome.candidate.name}</h3>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            {outcome.vote_count.toLocaleString()} votes · {outcome.share_percent}% of total
          </p>
        </div>
      </div>
    </div>
  )
}
