import { useEffect, useRef } from 'react'
import { ensureElectionVotingReady } from '@/services/votingService'
import { shouldEnsureVotingReady } from '@/utils/autoFinalizeVoterRoll'
import type { Election } from '@/types/election'

type ElectionSlice = Pick<Election, 'id' | 'status' | 'start_date' | 'end_date' | 'voter_roll_finalized_at'>

export interface UseEnsureVotingReadyWhenDueOptions {
  election: ElectionSlice | null | undefined
  enabled?: boolean
  /** Re-fetch election after auto-finalize (e.g. parent load()). */
  onPrepared?: () => void | Promise<void>
  /** Poll every N ms while roll is not finalized (default 60s). */
  pollMs?: number
}

/**
 * When the scheduled voting window starts, finalize the voter roll, email secret IDs,
 * and open voting — without requiring the creator to click Finalize.
 */
export function useEnsureVotingReadyWhenDue({
  election,
  enabled = true,
  onPrepared,
  pollMs = 60_000,
}: UseEnsureVotingReadyWhenDueOptions): void {
  const preparingRef = useRef(false)

  useEffect(() => {
    if (!enabled || !election?.id) return
    if (!shouldEnsureVotingReady(election)) return

    const electionId = election.id
    let cancelled = false

    async function run() {
      if (preparingRef.current) return
      preparingRef.current = true
      try {
        const result = await ensureElectionVotingReady(electionId)
        if (cancelled) return
        if (result.finalized || result.emailed || result.reason === 'already_finalized') {
          await onPrepared?.()
        }
      } finally {
        preparingRef.current = false
      }
    }

    void run()

    const needsPoll = !election.voter_roll_finalized_at
    if (!needsPoll) return () => {
      cancelled = true
    }

    const intervalId = window.setInterval(() => {
      if (cancelled || preparingRef.current) return
      void run()
    }, pollMs)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [
    enabled,
    election?.id,
    election?.status,
    election?.start_date,
    election?.end_date,
    election?.voter_roll_finalized_at,
    onPrepared,
    pollMs,
  ])
}
