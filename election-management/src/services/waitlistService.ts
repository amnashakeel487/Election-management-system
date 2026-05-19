import { supabase } from '@/lib/supabase'
import { sendSecretVoterIdEmails } from '@/services/secretVoterIdService'

export interface WaitlistEntry {
  registration_id: string
  user_id: string
  email: string
  full_name: string | null
  waitlist_position: number
  created_at: string
}

export interface PromoteWaitlistResult {
  promoted?: Array<{
    registration_id: string
    user_id: string
    previous_position?: number
  }>
  promoted_count?: number
  reason?: string
}

function promotedList(result: PromoteWaitlistResult): Array<{ user_id: string }> {
  const raw = result.promoted
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return []
}

export async function fetchElectionWaitlist(electionId: string): Promise<WaitlistEntry[]> {
  const { data, error } = await supabase.rpc('get_election_waitlist', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return (data ?? []) as WaitlistEntry[]
}

export async function promoteNextWaitlistSlots(
  electionId: string,
  maxPromotions = 10,
): Promise<PromoteWaitlistResult> {
  const { data, error } = await supabase.rpc('promote_waitlist_slots', {
    p_election_id: electionId,
    p_max_promotions: maxPromotions,
  })

  if (error) throw new Error(error.message)

  const result = (data ?? {}) as PromoteWaitlistResult
  const promoted = promotedList(result)
  for (const p of promoted) {
    if (p.user_id) {
      void sendWaitlistEmail('waitlist_promoted', p.user_id, electionId).catch(() => undefined)
    }
  }
  if (promoted.length > 0) {
    void sendSecretVoterIdEmails(electionId).catch(() => undefined)
  }
  return result
}

export async function promoteWaitlistedParticipant(
  registrationId: string,
  electionId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('promote_waitlisted_participant', {
    p_registration_id: registrationId,
  })

  if (error) throw new Error(error.message)

  const row = data as { user_id?: string; success?: boolean }
  if (row?.user_id) {
    void sendWaitlistEmail('waitlist_promoted', row.user_id, electionId).catch(() => undefined)
  }
}

export async function rejectElectionParticipant(
  registrationId: string,
  electionId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('reject_election_participant', {
    p_registration_id: registrationId,
    p_reason: null,
  })

  if (error) throw new Error(error.message)

  const result = data as { auto_promoted?: PromoteWaitlistResult }
  for (const p of promotedList(result?.auto_promoted ?? {})) {
    if (p.user_id) {
      void sendWaitlistEmail('waitlist_promoted', p.user_id, electionId).catch(() => undefined)
    }
  }
}

export async function withdrawFromElection(electionId: string): Promise<void> {
  const { data, error } = await supabase.rpc('withdraw_from_election', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)

  const result = data as { auto_promoted?: PromoteWaitlistResult }
  for (const p of promotedList(result?.auto_promoted ?? {})) {
    if (p.user_id) {
      void sendWaitlistEmail('waitlist_promoted', p.user_id, electionId).catch(() => undefined)
    }
  }
}

export async function sendWaitlistEmail(
  kind: 'waitlist_joined' | 'waitlist_promoted',
  userId: string,
  electionId: string,
  waitlistPosition?: number,
): Promise<void> {
  await supabase.functions.invoke('send-waitlist-notification', {
    body: {
      kind,
      election_id: electionId,
      user_id: userId,
      waitlist_position: waitlistPosition,
    },
  })
}
