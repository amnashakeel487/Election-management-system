import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  target_user_id: string
  decision: 'approved' | 'rejected'
  rejection_reason?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const appUrl = Deno.env.get('APP_URL') ?? 'https://election-manager-systm-three.vercel.app'
    const fromEmail = Deno.env.get('CREATOR_APPROVAL_FROM_EMAIL') ?? 'FortressVote <onboarding@resend.dev>'

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
    if (!body.target_user_id || !body.decision) {
      return new Response(JSON.stringify({ error: 'target_user_id and decision are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: adminProfile } = await admin
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin' || adminProfile?.approval_status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: target, error: targetError } = await admin
      .from('users')
      .select('id, email, full_name, organization, election_purpose, approval_status')
      .eq('id', body.target_user_id)
      .eq('role', 'election_creator')
      .single()

    if (targetError || !target) {
      return new Response(JSON.stringify({ error: 'Creator not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const displayName = target.full_name?.trim() || 'Election Creator'
    const isApproved = body.decision === 'approved'

    const subject = isApproved
      ? 'FortressVote — Your Election Creator application was approved'
      : 'FortressVote — Update on your Election Creator application'

    const html = isApproved
      ? `
        <p>Hello ${displayName},</p>
        <p>Your request to become an <strong>Election Creator</strong> on FortressVote has been <strong>approved</strong>.</p>
        <p>You can now sign in and create secure elections from your creator dashboard:</p>
        <p><a href="${appUrl}/creator/dashboard">${appUrl}/creator/dashboard</a></p>
        ${target.organization ? `<p><strong>Organization:</strong> ${target.organization}</p>` : ''}
        <p>— FortressVote Platform Administration</p>
      `
      : `
        <p>Hello ${displayName},</p>
        <p>After review, your Election Creator application on FortressVote was <strong>not approved</strong> at this time.</p>
        ${body.rejection_reason ? `<p><strong>Reason:</strong> ${body.rejection_reason}</p>` : ''}
        <p>If you have questions, contact the platform administrator.</p>
        <p>— FortressVote Platform Administration</p>
      `

    if (!resendApiKey) {
      console.log(`[dev] Creator ${body.decision} email for ${target.email}`)
      return new Response(
        JSON.stringify({ sent: false, dev_mode: true, message: 'RESEND_API_KEY not set; logged to console' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [target.email],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return new Response(JSON.stringify({ error: `Email failed: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sent: true, email: target.email }), {
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
