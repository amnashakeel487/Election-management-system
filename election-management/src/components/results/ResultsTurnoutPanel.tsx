import type { ElectionResultsPayload } from '@/types/electionResults'
import { formatTurnoutPercent } from '@/utils/resultsDisplay'

interface ResultsTurnoutPanelProps {
  results: ElectionResultsPayload
}

export function ResultsTurnoutPanel({ results }: ResultsTurnoutPanelProps) {
  const turnout = Math.min(100, Math.max(0, Number(results.turnout_percent) || 0))
  const registered = results.registered_voters ?? 0
  const voted = results.total_votes ?? 0
  const remaining = Math.max(0, registered - voted)

  return (
    <div className="glass-panel rounded-[24px] p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
            Voter turnout
          </p>
          <p className="mt-1 font-headline-xl text-headline-xl text-primary">{formatTurnoutPercent(turnout)}</p>
        </div>
        <div className="text-right">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Ballots cast</p>
          <p className="font-headline-md text-headline-md text-on-surface">
            {voted.toLocaleString()}
            <span className="font-body-sm text-on-surface-variant"> / {registered.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="mb-3 h-4 overflow-hidden rounded-full bg-surface-container-high">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${turnout}%`,
            background: 'linear-gradient(90deg, #2451A3, #6C3FC5)',
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-line bg-surface-container-low/50 px-3 py-2">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Registered</p>
          <p className="font-headline-md text-headline-md text-on-surface">{registered.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-container-low/50 px-3 py-2">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Voted</p>
          <p className="font-headline-md text-headline-md text-tertiary">{voted.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-container-low/50 px-3 py-2">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Not voted</p>
          <p className="font-headline-md text-headline-md text-on-surface-variant">{remaining.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
