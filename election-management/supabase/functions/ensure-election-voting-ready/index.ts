import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  election_id: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const cronSecret = Deno.env.get('CRON_SECRET')

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

    const { data: autoResult, error: autoError } = await admin.rpc('maybe_auto_finalize_election_voter_roll', {
      p_election_id: body.election_id,
    })

    if (autoError) {
      return new Response(JSON.stringify({ error: autoError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const finalized = Boolean(
      autoResult && typeof autoResult === 'object' && (autoResult as { finalized?: boolean }).finalized,
    )

    let emailResult: unknown = null

    if (finalized || (autoResult as { reason?: string })?.reason === 'already_finalized') {
      const emailHeaders: Record<string, string> = {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      }
      if (cronSecret) {
        emailHeaders['x-cron-secret'] = cronSecret
      }

      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-secret-voter-ids`, {
        method: 'POST',
        headers: emailHeaders,
        body: JSON.stringify({
          election_id: body.election_id,
          scope: 'all_pending',
          cron_secret: cronSecret ?? undefined,
        }),
      })
      emailResult = await emailRes.json()
    }

    const { data: status } = await admin.rpc('get_election_voting_status', {
      p_election_id: body.election_id,
    })

    return new Response(
      JSON.stringify({
        auto_finalize: autoResult,
        email: emailResult,
        voting_status: status,
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
