import { useEffect, useRef } from 'react'
import { checkAndFinalizeElection } from '@/services/electionFinalizeService'
import { shouldEnsureVotingReady } from '@/utils/autoFinalizeVoterRoll'
import type { VoterRegistrationWithElection } from '@/types/voterRegistration'
import { registrationNeedsVotingPrep } from '@/utils/voterElectionUi'

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

  const onPreparedRef = useRef(onPrepared)
  onPreparedRef.current = onPrepared

  useEffect(() => {
    if (!enabled || !election?.id) return
    if (!shouldEnsureVotingReady(election)) return

    const electionId = election.id
    let cancelled = false

    async function run() {
      if (preparingRef.current) return
      preparingRef.current = true
      try {
        const result = await checkAndFinalizeElection(electionId)
        if (cancelled) return
        if (result.success || result.finalized || result.emailed) {
          await onPreparedRef.current?.()
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
    pollMs,
  ])
}

/** Auto-finalize + email for registrations that still need secret IDs / emails. */
export function useEnsureDueElectionsPrepared(
  registrations: VoterRegistrationWithElection[],
  onPrepared?: () => void | Promise<void>,
  pollMs = 15_000,
): void {
  const preparingRef = useRef(false)
  const onPreparedRef = useRef(onPrepared)
  onPreparedRef.current = onPrepared
  const dueKey = registrations
    .filter(registrationNeedsVotingPrep)
    .map(
      (r) =>
        `${r.election_id}:${r.election?.voter_roll_finalized_at ?? ''}:${r.secret_voter_id ?? ''}:${r.secret_voter_id_emailed_at ?? ''}`,
    )
    .join('|')

  useEffect(() => {
    const electionIds = [
      ...new Set(
        registrations.filter(registrationNeedsVotingPrep).map((r) => r.election_id),
      ),
    ]
    if (electionIds.length === 0) return

    let cancelled = false

    async function runAll() {
      if (preparingRef.current) return
      preparingRef.current = true
      try {
        let changed = false
        for (const id of electionIds) {
          if (cancelled) return
          const result = await checkAndFinalizeElection(id)
          if (result.success || result.finalized || result.emailed) {
            changed = true
          }
          if (result.error) {
            console.warn('[auto-finalize]', id, result.error)
          }
        }
        if (changed && !cancelled) {
          await onPreparedRef.current?.()
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
  }, [dueKey, pollMs])
}
