import { useEffect, useRef } from 'react'
import { ensureElectionVotingReady } from '@/services/votingService'
import { shouldEnsureVotingReady } from '@/utils/autoFinalizeVoterRoll'

export type ElectionVotingReadySlice = {
  id: string
  status: string
  start_date: string
  end_date: string
  voter_roll_finalized_at?: string | null
}

export interface UseEnsureVotingReadyWhenDueOptions {
  election: ElectionVotingReadySlice | null | undefined
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
        if (result.finalized || result.emailed) {
          await onPrepared?.()
        }
      } finally {
        preparingRef.current = false
      }
    }

    void run()

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

/** Auto-finalize + email for every election in the voting window (voter dashboard). */
export function useEnsureDueElectionsPrepared(
  elections: ElectionVotingReadySlice[],
  onPrepared?: () => void | Promise<void>,
  pollMs = 30_000,
): void {
  const preparingRef = useRef(false)
  const dueKey = elections
    .filter(shouldEnsureVotingReady)
    .map((e) => `${e.id}:${e.voter_roll_finalized_at ?? ''}`)
    .join('|')

  useEffect(() => {
    const due = elections.filter(shouldEnsureVotingReady)
    if (due.length === 0) return

    let cancelled = false

    async function runAll() {
      if (preparingRef.current) return
      preparingRef.current = true
      try {
        let changed = false
        for (const e of due) {
          if (cancelled) return
          const result = await ensureElectionVotingReady(e.id)
          if (result.finalized || result.emailed || result.reason === 'already_ready') {
            changed = true
          }
          if (result.error?.includes('migration')) {
            console.warn(result.error)
          }
        }
        if (changed && !cancelled) {
          await onPrepared?.()
        }
      } finally {
        preparingRef.current = false
      }
    }

    void runAll()
    const intervalId = window.setInterval(() => {
      if (cancelled || preparingRef.current) return
      void runAll()
    }, pollMs)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [dueKey, onPrepared, pollMs])
}
