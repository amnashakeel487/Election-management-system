import { useEffect, useState } from 'react'
import {
  fetchElectionRollReadiness,
  type ElectionRollReadiness,
} from '@/services/electionFinalizeService'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { isVotingWindowStarted } from '@/utils/autoFinalizeVoterRoll'
import type { ElectionWithCandidates } from '@/types/election'

export type CreatorRollUiPhase =
  | 'registration_open'
  | 'registration_locked'
  | 'finalizing'
  | 'secret_ids_generated'
  | 'voting_active'
  | 'ended'

function deriveCreatorPhase(
  election: ElectionWithCandidates,
  readiness: ElectionRollReadiness | null,
): CreatorRollUiPhase {
  const nowMs = Date.now()
  const display = electionDisplayStatus(election.status, election.start_date, election.end_date, nowMs)

  if (display === 'completed' || election.status === 'completed' || election.status === 'archived') {
    return 'ended'
  }

  if (readiness?.ready_for_voting && isVotingWindowStarted(election)) {
    return 'voting_active'
  }

  if (readiness?.secret_ids_generated || election.secret_ids_generated) {
    return 'secret_ids_generated'
  }

  if (
    isVotingWindowStarted(election) &&
    !readiness?.ready_for_voting &&
    !election.voter_roll_finalized_at
  ) {
    return 'finalizing'
  }

  if (election.registration_locked_at || election.voter_roll_finalized_at) {
    return 'registration_locked'
  }

  return 'registration_open'
}

const PHASE_LABELS: Record<CreatorRollUiPhase, string> = {
  registration_open: 'Registration open',
  registration_locked: 'Registration locked',
  finalizing: 'Finalizing voters',
  secret_ids_generated: 'Secret IDs generated',
  voting_active: 'Voting active',
  ended: 'Election ended',
}

export interface ElectionRollStatusPanelProps {
  election: ElectionWithCandidates
  finalizeStepLabel?: string
}

export function ElectionRollStatusPanel({ election, finalizeStepLabel }: ElectionRollStatusPanelProps) {
  const [readiness, setReadiness] = useState<ElectionRollReadiness | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchElectionRollReadiness(election.id)
      .then((r) => {
        if (!cancelled) setReadiness(r)
      })
      .catch(() => {
        if (!cancelled) setReadiness(null)
      })
    return () => {
      cancelled = true
    }
  }, [
    election.id,
    election.voter_roll_finalized_at,
    election.secret_ids_generated,
    election.status,
  ])

  const phase = deriveCreatorPhase(election, readiness)
  const label = PHASE_LABELS[phase]

  return (
    <div className="card-elevated" style={{ marginBottom: 16 }} role="status" aria-live="polite">
      <div className="card-body" style={{ fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Voter roll status</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <span className="badge b-active">{label}</span>
          {election.voter_roll_finalized_at ? (
            <span className="badge b-voted">Roll finalized</span>
          ) : (
            <span className="badge b-pending">Roll not finalized</span>
          )}
          {readiness?.secret_ids_generated || election.secret_ids_generated ? (
            <span className="badge b-voted">IDs generated</span>
          ) : null}
          {(readiness?.emails_pending ?? 0) > 0 ? (
            <span className="badge b-pending">{readiness?.emails_pending} emails pending</span>
          ) : null}
        </div>
        {finalizeStepLabel ? (
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 12 }}>{finalizeStepLabel}</p>
        ) : null}
        {phase === 'finalizing' ? (
          <p style={{ color: 'var(--muted)', margin: finalizeStepLabel ? '8px 0 0' : 0, fontSize: 12 }}>
            Voting time has started. The system will auto-finalize the roll, assign secret IDs, and email
            voters. This runs automatically — no manual finalize required.
          </p>
        ) : null}
        {readiness ? (
          <p style={{ color: 'var(--subtle)', marginTop: 8, marginBottom: 0, fontSize: 11 }}>
            Registered: {readiness.registered_count} · With secret ID: {readiness.with_secret_count}
          </p>
        ) : null}
      </div>
    </div>
  )
}
