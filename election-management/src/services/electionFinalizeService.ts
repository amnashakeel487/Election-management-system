import { supabase } from '@/lib/supabase'
import { sendSecretVoterIdEmails } from '@/services/secretVoterIdService'
import { isVotingWindowStarted } from '@/utils/autoFinalizeVoterRoll'

export type FinalizeProgressStep =
  | 'idle'
  | 'checking'
  | 'finalizing_roll'
  | 'generating_ids'
  | 'sending_emails'
  | 'ready'
  | 'failed'

export interface ElectionRollReadiness {
  found: boolean
  election_id?: string
  status?: string
  voter_roll_finalized: boolean
  voter_roll_finalized_at?: string | null
  registration_locked: boolean
  secret_ids_generated: boolean
  registered_count: number
  with_secret_count: number
  emails_pending: number
  voting_window_started: boolean
  voting_window_open: boolean
  ready_for_voting: boolean
}

export interface CheckAndFinalizeResult {
  success: boolean
  step: FinalizeProgressStep
  readiness: ElectionRollReadiness | null
  finalized: boolean
  emailed: boolean
  assigned_count?: number
  reason?: string
  error?: string
}

export async function fetchElectionRollReadiness(electionId: string): Promise<ElectionRollReadiness> {
  const { data, error } = await supabase.rpc('get_election_roll_readiness', {
    p_election_id: electionId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const raw = data as Record<string, unknown>
  return {
    found: Boolean(raw.found),
    election_id: raw.election_id as string | undefined,
    status: raw.status as string | undefined,
    voter_roll_finalized: Boolean(raw.voter_roll_finalized),
    voter_roll_finalized_at: (raw.voter_roll_finalized_at as string | null) ?? null,
    registration_locked: Boolean(raw.registration_locked),
    secret_ids_generated: Boolean(raw.secret_ids_generated),
    registered_count: Number(raw.registered_count ?? 0),
    with_secret_count: Number(raw.with_secret_count ?? 0),
    emails_pending: Number(raw.emails_pending ?? 0),
    voting_window_started: Boolean(raw.voting_window_started),
    voting_window_open: Boolean(raw.voting_window_open),
    ready_for_voting: Boolean(raw.ready_for_voting),
  }
}

/**
 * Auto-finalize voter roll at voting start, generate secret IDs, and email voters.
 * Idempotent: safe to call on refresh, page load, or countdown zero.
 */
export async function checkAndFinalizeElection(electionId: string): Promise<CheckAndFinalizeResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return {
      success: false,
      step: 'failed',
      readiness: null,
      finalized: false,
      emailed: false,
      reason: 'not_authenticated',
      error: 'Not signed in',
    }
  }

  let readiness: ElectionRollReadiness

  try {
    readiness = await fetchElectionRollReadiness(electionId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('does not exist') || msg.includes('Could not find the function')) {
      return legacyFinalizeAndEmail(electionId)
    }
    return {
      success: false,
      step: 'failed',
      readiness: null,
      finalized: false,
      emailed: false,
      error: msg || 'Could not read election status',
    }
  }

  if (!readiness.found) {
    return {
      success: false,
      step: 'failed',
      readiness,
      finalized: false,
      emailed: false,
      reason: 'not_found',
      error: 'Election not found',
    }
  }

  if (readiness.ready_for_voting && readiness.emails_pending === 0) {
    return {
      success: true,
      step: 'ready',
      readiness,
      finalized: true,
      emailed: true,
      reason: 'already_ready',
    }
  }

  const windowStarted = readiness.voting_window_started
  if (!windowStarted) {
    return {
      success: false,
      step: 'idle',
      readiness,
      finalized: readiness.voter_roll_finalized,
      emailed: false,
      reason: 'before_start',
    }
  }

  let finalized = readiness.voter_roll_finalized
  let assignedCount = 0
  let finalizeReason: string | undefined

  if (!readiness.voter_roll_finalized) {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'maybe_auto_finalize_election_voter_roll',
      { p_election_id: electionId },
    )

    if (rpcError) {
      const msg = rpcError.message ?? 'Auto-finalize failed'
      if (msg.includes('does not exist') || msg.includes('Could not find the function')) {
        return {
          success: false,
          step: 'failed',
          readiness,
          finalized: false,
          emailed: false,
          error:
            'Database migration 035/037/042 is not applied. Run supabase/scripts/auto_finalize_voting_start_sql_editor.sql in Supabase SQL Editor.',
        }
      }
      return {
        success: false,
        step: 'failed',
        readiness,
        finalized: false,
        emailed: false,
        error: msg,
      }
    }

    const auto = rpcData as { finalized?: boolean; reason?: string; assigned_count?: number }
    finalized = Boolean(auto.finalized) || auto.reason === 'already_finalized'
    assignedCount = Number(auto.assigned_count ?? 0)
    finalizeReason = auto.reason
    readiness = await fetchElectionRollReadiness(electionId)
  }

  if (!readiness.secret_ids_generated && readiness.registered_count > 0) {
    return {
      success: false,
      step: 'failed',
      readiness,
      finalized: readiness.voter_roll_finalized,
      emailed: false,
      error: 'Secret voter IDs were not generated for all registered voters',
    }
  }

  let emailed = false
  if (finalized || readiness.voter_roll_finalized) {
    try {
      const { data, error } = await supabase.functions.invoke('ensure-election-voting-ready', {
        body: { election_id: electionId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (error) {
        try {
          const email = await sendSecretVoterIdEmails(electionId)
          emailed = email.sent > 0 || readiness.emails_pending === 0
        } catch (emailErr) {
          return {
            success: false,
            step: 'failed',
            readiness,
            finalized: true,
            emailed: false,
            assigned_count: assignedCount,
            reason: finalizeReason,
            error: emailErr instanceof Error ? emailErr.message : 'Failed to send voter emails',
          }
        }
      } else if (data && typeof data === 'object') {
        const emailPayload = (data as { email?: { sent?: number } }).email
        emailed =
          typeof emailPayload?.sent === 'number'
            ? emailPayload.sent > 0
            : readiness.emails_pending === 0
      }
    } catch (err) {
      return {
        success: false,
        step: 'failed',
        readiness,
        finalized: true,
        emailed: false,
        error: err instanceof Error ? err.message : 'Email step failed',
      }
    }

    readiness = await fetchElectionRollReadiness(electionId)
  }

  const idsReady = Boolean(readiness.ready_for_voting)
  const emailsDone =
    readiness.registered_count === 0 || readiness.emails_pending === 0
  const success = idsReady && emailsDone

  let finalStep: FinalizeProgressStep = 'failed'
  if (success) {
    finalStep = 'ready'
  } else if (!readiness.voter_roll_finalized) {
    finalStep = 'finalizing_roll'
  } else if (!readiness.secret_ids_generated) {
    finalStep = 'generating_ids'
  } else if (!emailsDone) {
    finalStep = 'sending_emails'
  }

  return {
    success,
    step: finalStep,
    readiness,
    finalized: readiness.voter_roll_finalized,
    emailed: emailed || readiness.emails_pending === 0,
    assigned_count: assignedCount,
    reason: finalizeReason ?? (success ? 'ready' : 'not_ready'),
    error: success ? undefined : 'Voting is not ready until the voter roll is finalized and secret IDs are issued',
  }
}

/** When migration 042 is missing, still finalize + email via 035 RPC + edge function. */
async function legacyFinalizeAndEmail(electionId: string): Promise<CheckAndFinalizeResult> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'maybe_auto_finalize_election_voter_roll',
    { p_election_id: electionId },
  )

  if (rpcError) {
    const msg = rpcError.message ?? 'Auto-finalize failed'
    return {
      success: false,
      step: 'failed',
      readiness: null,
      finalized: false,
      emailed: false,
      error: msg.includes('does not exist')
        ? 'Run supabase/scripts/auto_finalize_voting_start_sql_editor.sql in Supabase SQL Editor.'
        : msg,
    }
  }

  const auto = rpcData as { finalized?: boolean; reason?: string; assigned_count?: number }
  const finalized =
    Boolean(auto.finalized) || auto.reason === 'already_finalized'

  let emailed = false
  let emailError: string | undefined

  if (finalized) {
    try {
      const email = await sendSecretVoterIdEmails(electionId)
      emailed = email.sent > 0
      if (email.errors.length > 0) {
        emailError = email.errors.join('; ')
      }
    } catch (e) {
      emailError = e instanceof Error ? e.message : 'Failed to send emails'
    }
  }

  return {
    success: finalized && emailed,
    step: emailed ? 'ready' : finalized ? 'sending_emails' : 'failed',
    readiness: null,
    finalized,
    emailed,
    assigned_count: Number(auto.assigned_count ?? 0),
    reason: auto.reason,
    error: emailError,
  }
}

export function electionNeedsAutoFinalize(election: {
  status: string
  start_date: string
  end_date: string
  voter_roll_finalized_at?: string | null
  secret_ids_generated?: boolean
}): boolean {
  if (!isVotingWindowStarted(election)) return false
  if (Date.now() > new Date(election.end_date).getTime()) return false
  if (!election.voter_roll_finalized_at) return true
  if (election.secret_ids_generated === false) return true
  return false
}
