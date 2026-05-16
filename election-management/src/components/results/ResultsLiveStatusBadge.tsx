import { resultsPhaseLabel } from '@/utils/resultsDisplay'
import type { ElectionResultsPayload } from '@/types/electionResults'

interface ResultsLiveStatusBadgeProps {
  results: ElectionResultsPayload
  lastUpdated: Date | null
}

export function ResultsLiveStatusBadge({ results, lastUpdated }: ResultsLiveStatusBadgeProps) {
  const label = resultsPhaseLabel(results)

  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      {results.is_live ? (
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="font-label-md text-label-md text-primary">Live vote counting</span>
        </div>
      ) : results.results_locked_at ? (
        <div className="flex items-center gap-2 rounded-full border border-tertiary/30 bg-tertiary/10 px-4 py-2">
          <span className="material-symbols-outlined text-[18px] text-tertiary">lock</span>
          <span className="font-label-md text-label-md text-tertiary">{label}</span>
        </div>
      ) : (
        <span className="rounded-full border border-line bg-surface-container-high px-4 py-2 font-label-md text-label-md text-on-surface-variant">
          {label}
        </span>
      )}
      {lastUpdated ? (
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Last updated {lastUpdated.toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  )
}
