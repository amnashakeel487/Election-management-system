import { useState } from 'react'
import { lockElectionResults } from '@/services/resultsService'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { canLockResults } from '@/utils/resultsDisplay'

interface ResultsLockPanelProps {
  results: ElectionResultsPayload
  isCreator: boolean
  onLocked: (updated: ElectionResultsPayload) => void
}

export function ResultsLockPanel({ results, isCreator, onLocked }: ResultsLockPanelProps) {
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (results.results_locked_at) {
    return (
      <div className="mb-8 rounded-[24px] border border-tertiary/30 bg-tertiary/10 px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-tertiary">verified</span>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">Final results locked</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Certified on {new Date(results.results_locked_at).toLocaleString()}. Tallies will no longer
              update in real time.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!canLockResults(results, isCreator)) {
    return null
  }

  async function handleLock() {
    if (
      !window.confirm(
        'Lock final results? This publishes the certified outcome and stops live updates. This cannot be undone.',
      )
    ) {
      return
    }

    setLocking(true)
    setError(null)
    try {
      const updated = await lockElectionResults(results.election_id)
      onLocked(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock results')
    } finally {
      setLocking(false)
    }
  }

  return (
    <div className="mb-8 rounded-[24px] border border-warning/30 bg-warning/10 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-headline-md text-headline-md text-on-surface">Lock final results</p>
          <p className="mt-1 max-w-xl font-body-sm text-body-sm text-on-surface-variant">
            Voting has ended. Lock results to certify the winner and turnout figures for your records.
          </p>
          {error ? <p className="mt-2 font-body-sm text-error">{error}</p> : null}
        </div>
        <button
          type="button"
          disabled={locking}
          onClick={() => void handleLock()}
          className="rounded-xl bg-tertiary px-6 py-3 font-label-md text-label-md text-on-tertiary disabled:opacity-60"
        >
          {locking ? 'Locking…' : 'Lock & certify results'}
        </button>
      </div>
    </div>
  )
}
