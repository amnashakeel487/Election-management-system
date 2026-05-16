import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getBrevoApiKey, sendBrevoEmail } from './brevo.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  election_id: string
  /** all_pending: creator batch (default). self: current voter only. */
  scope?: 'all_pending' | 'self'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const brevoConfigured = Boolean(getBrevoApiKey())

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as RequestBody
    if (!body.election_id) {
      return new Response(JSON.stringify({ error: 'election_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: election, error: electionError } = await admin
      .from('elections')
      .select('id, title, creator_id, voter_roll_finalized_at')
      .eq('id', body.election_id)
      .single()

    if (electionError || !election) {
      return new Response(JSON.stringify({ error: 'Election not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const scope = body.scope ?? 'all_pending'

    if (scope !== 'self' && election.creator_id !== user.id) {
      const { data: profile } = await admin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (!election.voter_roll_finalized_at) {
      return new Response(JSON.stringify({ error: 'Voter roll is not finalized yet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    type RegRow = {
      id: string
      user_id: string
      secret_voter_id: string | null
      secret_voter_id_emailed_at: string | null
    }

    let registrations: RegRow[] = []

    if (scope === 'self') {
      const { data: selfReg, error: selfRegError } = await admin
        .from('voter_registrations')
        .select('id, user_id, secret_voter_id, secret_voter_id_emailed_at')
        .eq('election_id', body.election_id)
        .eq('user_id', user.id)
        .eq('status', 'registered')
        .not('secret_voter_id', 'is', null)
        .maybeSingle()

      if (selfRegError) {
        return new Response(JSON.stringify({ error: selfRegError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!selfReg?.secret_voter_id) {
        return new Response(
          JSON.stringify({ error: 'No secret voter ID issued for your registration yet' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      registrations = [selfReg as RegRow]
    } else {
      const { data: batchRegs, error: regError } = await admin
        .from('voter_registrations')
        .select('id, user_id, secret_voter_id, secret_voter_id_emailed_at')
        .eq('election_id', body.election_id)
        .eq('status', 'registered')
        .not('secret_voter_id', 'is', null)
        .is('secret_voter_id_emailed_at', null)

      if (regError) {
        return new Response(JSON.stringify({ error: regError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      registrations = (batchRegs ?? []) as RegRow[]
    }

    const userIds = [...new Set((registrations ?? []).map((r) => r.user_id))]
    const { data: users } = await admin.from('users').select('id, email, full_name').in('id', userIds)
    const userById = new Map((users ?? []).map((u) => [u.id, u]))

    let sent = 0
    const errors: string[] = []

    for (const reg of registrations ?? []) {
      const recipient = userById.get(reg.user_id)
      const email = recipient?.email
      if (!email || !reg.secret_voter_id) continue

      if (!brevoConfigured) {
        console.log(`[dev] Secret voter ID for ${email}: ${reg.secret_voter_id}`)
        await admin
          .from('voter_registrations')
          .update({ secret_voter_id_emailed_at: new Date().toISOString() })
          .eq('id', reg.id)
        sent++
        continue
      }

      const htmlContent = `
        <p>You are registered for <strong>${election.title}</strong>.</p>
        <p>Your unique Secret Voter ID is:</p>
        <p style="font-family: monospace; font-size: 20px; letter-spacing: 2px;"><strong>${reg.secret_voter_id}</strong></p>
        <p>Keep this ID private. You will need it to cast your vote. Do not share it with anyone.</p>
        <p>In the app your ID is masked (e.g. ****${reg.secret_voter_id.slice(-4)}) until you reveal it.</p>
        <p>Each election uses a different secret ID — this ID applies only to this poll.</p>
        <p>— FortressVote</p>
      `

      const result = await sendBrevoEmail({
        to: { email, name: recipient?.full_name?.trim() || email },
        subject: `Your Secret Voter ID — ${election.title}`,
        htmlContent,
      })

      if (!result.ok) {
        errors.push(`${email}: ${result.error}`)
        continue
      }

      await admin
        .from('voter_registrations')
        .update({ secret_voter_id_emailed_at: new Date().toISOString() })
        .eq('id', reg.id)

      sent++
    }

    return new Response(
      JSON.stringify({
        sent,
        pending: (registrations ?? []).length - sent,
        errors,
        dev_mode: !brevoConfigured,
      }),
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
