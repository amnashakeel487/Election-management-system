import { useCallback, useEffect, useRef, useState } from 'react'
import {
  checkAndFinalizeElection,
  type CheckAndFinalizeResult,
  type FinalizeProgressStep,
} from '@/services/electionFinalizeService'
import { shouldEnsureVotingReady } from '@/utils/autoFinalizeVoterRoll'

export interface UseCheckAndFinalizeElectionOptions {
  electionId: string | undefined
  election?: {
    status: string
    start_date: string
    end_date: string
    voter_roll_finalized_at?: string | null
  } | null
  enabled?: boolean
  pollMs?: number
  onComplete?: (result: CheckAndFinalizeResult) => void | Promise<void>
}

const STEP_LABELS: Record<FinalizeProgressStep, string> = {
  idle: '',
  checking: 'Checking election status…',
  finalizing_roll: 'Finalizing voter list…',
  generating_ids: 'Generating secret voter IDs…',
  sending_emails: 'Sending voter emails…',
  ready: 'Voting is ready',
  failed: 'Could not prepare voting',
}

export function useCheckAndFinalizeElection({
  electionId,
  election,
  enabled = true,
  pollMs = 30_000,
  onComplete,
}: UseCheckAndFinalizeElectionOptions) {
  const [step, setStep] = useState<FinalizeProgressStep>('idle')
  const [result, setResult] = useState<CheckAndFinalizeResult | null>(null)
  const runningRef = useRef(false)

  const run = useCallback(async () => {
    if (!electionId || runningRef.current) return null
    runningRef.current = true
    setStep('checking')
    try {
      const out = await checkAndFinalizeElection(electionId)
      setResult(out)
      setStep(out.step)
      await onComplete?.(out)
      return out
    } finally {
      runningRef.current = false
    }
  }, [electionId, onComplete])

  useEffect(() => {
    if (!enabled || !electionId) return
    const due = election ? shouldEnsureVotingReady(election) : true
    if (!due) {
      setStep('idle')
      return
    }

    let cancelled = false

    void (async () => {
      if (cancelled) return
      await run()
    })()

    const id = window.setInterval(() => {
      if (cancelled || runningRef.current) return
      void run()
    }, pollMs)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [
    enabled,
    electionId,
    election?.status,
    election?.start_date,
    election?.end_date,
    election?.voter_roll_finalized_at,
    pollMs,
    run,
  ])

  return {
    step,
    stepLabel: STEP_LABELS[step],
    result,
    isPreparing: step !== 'idle' && step !== 'ready' && step !== 'failed',
    run,
  }
}
