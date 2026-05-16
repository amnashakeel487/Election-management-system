import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

type ElectionRef = { id: string; title: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const cronSecret = Deno.env.get('CRON_SECRET')
    const authHeader = req.headers.get('Authorization')
    const headerCron = req.headers.get('x-cron-secret')

    let body: { cron_secret?: string } = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const cronOk =
      Boolean(cronSecret) &&
      (body.cron_secret === cronSecret || headerCron === cronSecret)

    if (!cronOk && authHeader) {
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
      const adminCheck = createClient(supabaseUrl, serviceRoleKey)
      const { data: profile } = await adminCheck.from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (!cronOk) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { data: pending, error } = await admin.rpc('get_elections_pending_notifications')
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: Record<string, unknown> = {}
    const milestones = ['election_start', 'election_end', 'winner'] as const

    for (const milestone of milestones) {
      const elections = (pending?.[milestone] ?? []) as ElectionRef[]
      const milestoneResults: unknown[] = []

      for (const e of elections) {
        const invokeRes = await fetch(`${supabaseUrl}/functions/v1/send-election-notifications`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            election_id: e.id,
            milestone,
            cron_secret: cronSecret,
          }),
        })
        const json = await invokeRes.json()
        milestoneResults.push({ election_id: e.id, title: e.title, ...json })
      }

      results[milestone] = milestoneResults
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
