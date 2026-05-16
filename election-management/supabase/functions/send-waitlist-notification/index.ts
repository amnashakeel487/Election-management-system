import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { sendBrevoEmail, getBrevoApiKey } from '../_shared/brevo.ts'
import { waitlistJoinedEmailHtml, waitlistPromotedEmailHtml } from '../_shared/notification-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type WaitlistKind = 'waitlist_joined' | 'waitlist_promoted'

interface RequestBody {
  kind: WaitlistKind
  election_id: string
  user_id?: string
  waitlist_position?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const brevoConfigured = Boolean(getBrevoApiKey())
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as RequestBody
    if (!body.election_id || !body.kind) {
      return new Response(JSON.stringify({ error: 'election_id and kind are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: election } = await admin
      .from('elections')
      .select('id, title, creator_id')
      .eq('id', body.election_id)
      .single()

    if (!election) {
      return new Response(JSON.stringify({ error: 'Election not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: caller },
    } = await userClient.auth.getUser()

    const targetUserId = body.user_id ?? caller?.id
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await admin.from('users').select('role').eq('id', caller?.id).single()
    const isAdmin = profile?.role === 'admin'
    const isCreator = election.creator_id === caller?.id
    const isSelf = caller?.id === targetUserId

    if (!isAdmin && !isCreator && !isSelf) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: target } = await admin
      .from('users')
      .select('email, full_name')
      .eq('id', targetUserId)
      .single()

    if (!target?.email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const position = body.waitlist_position ?? 0
    const { subject, html } =
      body.kind === 'waitlist_joined'
        ? waitlistJoinedEmailHtml(election.title, position, election.id)
        : waitlistPromotedEmailHtml(election.title, election.id)

    let status: 'sent' | 'failed' | 'skipped' = 'skipped'
    let errorMsg: string | null = null

    if (!brevoConfigured) {
      console.log(`[dev] ${body.kind} for ${target.email}: ${subject}`)
      status = 'sent'
    } else {
      const result = await sendBrevoEmail({
        to: { email: target.email, name: target.full_name?.trim() || target.email },
        subject,
        htmlContent: html,
      })
      if (result.ok) {
        status = 'sent'
      } else {
        status = 'failed'
        errorMsg = result.error
      }
    }

    await admin.rpc('log_notification', {
      p_type: body.kind,
      p_recipient_email: target.email,
      p_status: status,
      p_recipient_user_id: targetUserId,
      p_election_id: body.election_id,
      p_subject: subject,
      p_error_message: errorMsg,
      p_metadata: { waitlist_position: position },
    })

    if (status === 'failed') {
      return new Response(JSON.stringify({ sent: false, error: errorMsg }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ sent: true, dev_mode: !brevoConfigured }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
