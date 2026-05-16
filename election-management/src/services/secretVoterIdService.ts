import { supabase } from '@/lib/supabase'

export interface FinalizeVoterRollResult {
  election_id: string
  finalized_at: string
  assigned_count: number
  registered_count?: number
  assignments: Array<{
    registration_id: string
    user_id: string
    secret_voter_id: string
  }>
}

export interface SendSecretVoterIdsResult {
  sent: number
  pending: number
  errors: string[]
  dev_mode?: boolean
}

export interface SecretVoterIdFormatPreview {
  prefix: string
  example_first: string
  example_last: string
  mask_example: string
}

const SECRET_ID_FUNCTION = 'send-secret-voter-ids'

function formatEdgeFunctionError(error: { message?: string }, functionName: string): string {
  const msg = error.message ?? 'Unknown error'
  if (
    msg.includes('Failed to send a request to the Edge Function') ||
    msg.includes('Failed to fetch') ||
    msg.includes('FunctionsFetchError') ||
    msg.toLowerCase().includes('not found')
  ) {
    return (
      `Could not reach the "${functionName}" Edge Function (not deployed or blocked). ` +
      'In Supabase Dashboard → Edge Functions, deploy send-secret-voter-ids and set BREVO_API_KEY + BREVO_SENDER_EMAIL secrets. ' +
      'See docs/AUTH_SETUP.md → Part 3.'
    )
  }
  return msg
}

export async function finalizeElectionVoterRoll(electionId: string): Promise<FinalizeVoterRollResult> {
  const { data, error } = await supabase.rpc('finalize_election_voter_roll', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return data as FinalizeVoterRollResult
}

export async function sendSecretVoterIdEmails(
  electionId: string,
  options?: { scope?: 'all_pending' | 'self' },
): Promise<SendSecretVoterIdsResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('You must be signed in to send secret voter ID emails.')
  }

  const { data, error } = await supabase.functions.invoke(SECRET_ID_FUNCTION, {
    body: { election_id: electionId, scope: options?.scope ?? 'all_pending' },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) {
    throw new Error(formatEdgeFunctionError(error, SECRET_ID_FUNCTION))
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: string }).error))
  }

  return data as SendSecretVoterIdsResult
}

/** Email the signed-in voter their secret ID for one poll (resend). */
export async function emailMySecretVoterId(electionId: string): Promise<SendSecretVoterIdsResult> {
  return sendSecretVoterIdEmails(electionId, { scope: 'self' })
}

export async function previewSecretVoterIdFormat(electionId: string): Promise<SecretVoterIdFormatPreview> {
  const { data, error } = await supabase.rpc('preview_secret_voter_id_format', {
    p_election_id: electionId,
  })

  if (error) throw new Error(error.message)
  return data as SecretVoterIdFormatPreview
}

export async function finalizeAndEmailSecretVoterIds(
  electionId: string,
): Promise<{ finalize: FinalizeVoterRollResult; email: SendSecretVoterIdsResult }> {
  const finalize = await finalizeElectionVoterRoll(electionId)

  try {
    const email = await sendSecretVoterIdEmails(electionId)
    return { finalize, email }
  } catch (emailErr) {
    const detail = emailErr instanceof Error ? emailErr.message : 'Email step failed'
    throw new Error(
      `Voter roll was finalized (${finalize.assigned_count} secret ID(s) assigned), but emailing failed: ${detail}`,
    )
  }
}
