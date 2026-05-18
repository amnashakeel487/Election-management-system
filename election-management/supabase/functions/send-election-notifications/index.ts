import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { sendBrevoEmail, getBrevoApiKey } from '../_shared/brevo.ts'
import {
  electionEndEmailHtml,
  electionStartEmailHtml,
  winnerEmailHtml,
} from '../_shared/notification-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

type Milestone = 'election_start' | 'election_end' | 'winner'

interface RequestBody {
  election_id: string
  milestone: Milestone
  /** Optional cron secret when no user JWT */
  cron_secret?: string
}

async function logNotification(
  admin: ReturnType<typeof createClient>,
  row: {
    type: string
    email: string
    userId?: string
    electionId: string
    subject: string
    status: 'sent' | 'failed' | 'skipped'
    error?: string
  },
) {
  await admin.rpc('log_notification', {
    p_type: row.type,
    p_recipient_email: row.email,
    p_status: row.status,
    p_recipient_user_id: row.userId ?? null,
    p_election_id: row.electionId,
    p_subject: row.subject,
    p_error_message: row.error ?? null,
    p_metadata: {},
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const cronSecret = Deno.env.get('CRON_SECRET')
    const brevoConfigured = Boolean(getBrevoApiKey())
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const body = (await req.json()) as RequestBody
    if (!body.election_id || !body.milestone) {
      return new Response(JSON.stringify({ error: 'election_id and milestone are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    const headerCron = req.headers.get('x-cron-secret')
    const cronOk =
      Boolean(cronSecret) &&
      (body.cron_secret === cronSecret || headerCron === cronSecret)

    if (!cronOk) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
      } = await userClient.auth.getUser()
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin' && body.milestone === 'winner') {
        const { data: election } = await admin
          .from('elections')
          .select('creator_id')
          .eq('id', body.election_id)
          .single()
        if (election?.creator_id !== user.id) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } else if (profile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const { data: election, error: electionError } = await admin
      .from('elections')
      .select('id, title, start_date, end_date, results_locked_at, voter_roll_finalized_at')
      .eq('id', body.election_id)
      .single()

    if (electionError || !election) {
      return new Response(JSON.stringify({ error: 'Election not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const notifType = body.milestone
    let sent = 0
    const errors: string[] = []

    if (body.milestone === 'winner') {
      const { data: results, error: resultsError } = await admin.rpc('get_election_results', {
        p_election_id: body.election_id,
      })
      if (resultsError) {
        return new Response(JSON.stringify({ error: resultsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const candidates = (results?.candidates as Array<{ name: string; vote_count: number; is_winner?: boolean }>) ?? []
      const winner = candidates.find((c) => c.is_winner) ?? candidates[0]
      const turnout = Number(results?.turnout_percent ?? 0)

      const { data: recipients } = await admin.rpc('get_election_voter_recipients', {
        p_election_id: body.election_id,
      })

      const winnerName = winner?.name ?? 'See results page'
      const voteCount = winner?.vote_count ?? 0
      const { subject, html } = winnerEmailHtml(election.title, winnerName, voteCount, turnout)

      for (const r of recipients ?? []) {
        if (!r.email) continue
        if (!brevoConfigured) {
          console.log(`[dev] Winner email to ${r.email}: ${subject}`)
          await logNotification(admin, {
            type: notifType,
            email: r.email,
            userId: r.user_id,
            electionId: body.election_id,
            subject,
            status: 'sent',
          })
          sent++
          continue
        }
        const result = await sendBrevoEmail({
          to: { email: r.email, name: r.full_name ?? r.email },
          subject,
          htmlContent: html,
        })
        if (!result.ok) {
          errors.push(`${r.email}: ${result.error}`)
          await logNotification(admin, {
            type: notifType,
            email: r.email,
            userId: r.user_id,
            electionId: body.election_id,
            subject,
            status: 'failed',
            error: result.error,
          })
          continue
        }
        await logNotification(admin, {
          type: notifType,
          email: r.email,
          userId: r.user_id,
          electionId: body.election_id,
          subject,
          status: 'sent',
        })
        sent++
      }

      await admin.rpc('mark_election_notification_sent', {
        p_election_id: body.election_id,
        p_milestone: 'winner',
      })
    } else {
      if (!election.voter_roll_finalized_at && body.milestone === 'election_start') {
        const { data: autoResult, error: autoError } = await admin.rpc(
          'maybe_auto_finalize_election_voter_roll',
          { p_election_id: body.election_id },
        )
        if (autoError) {
          return new Response(JSON.stringify({ error: autoError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const finalized = Boolean(
          autoResult && typeof autoResult === 'object' && (autoResult as { finalized?: boolean }).finalized,
        )
        if (!finalized) {
          return new Response(JSON.stringify({ error: 'Voter roll not finalized' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        election.voter_roll_finalized_at = new Date().toISOString()
        await fetch(`${supabaseUrl}/functions/v1/send-secret-voter-ids`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            election_id: body.election_id,
            scope: 'all_pending',
            cron_secret: cronSecret,
          }),
        })
      }

      const { data: recipients, error: recError } = await admin.rpc('get_election_voter_recipients', {
        p_election_id: body.election_id,
      })
      if (recError) {
        return new Response(JSON.stringify({ error: recError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      for (const r of recipients ?? []) {
        if (!r.email) continue
        const { subject, html } =
          body.milestone === 'election_start'
            ? electionStartEmailHtml(election.title, election.start_date, election.end_date)
            : electionEndEmailHtml(election.title)

        if (!brevoConfigured) {
          console.log(`[dev] ${body.milestone} to ${r.email}`)
          await logNotification(admin, {
            type: notifType,
            email: r.email,
            userId: r.user_id,
            electionId: body.election_id,
            subject,
            status: 'sent',
          })
          sent++
          continue
        }

        const result = await sendBrevoEmail({
          to: { email: r.email, name: r.full_name ?? r.email },
          subject,
          htmlContent: html,
        })

        if (!result.ok) {
          errors.push(`${r.email}: ${result.error}`)
          await logNotification(admin, {
            type: notifType,
            email: r.email,
            userId: r.user_id,
            electionId: body.election_id,
            subject,
            status: 'failed',
            error: result.error,
          })
          continue
        }

        await logNotification(admin, {
          type: notifType,
          email: r.email,
          userId: r.user_id,
          electionId: body.election_id,
          subject,
          status: 'sent',
        })
        sent++
      }

      await admin.rpc('mark_election_notification_sent', {
        p_election_id: body.election_id,
        p_milestone: body.milestone,
      })
    }

    return new Response(
      JSON.stringify({ sent, errors, dev_mode: !brevoConfigured, milestone: body.milestone }),
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
