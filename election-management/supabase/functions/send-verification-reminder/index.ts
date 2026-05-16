import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { sendBrevoEmail, getBrevoApiKey } from '../_shared/brevo.ts'
import { verificationEmailHtml } from '../_shared/notification-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string
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

    const body = (await req.json()) as RequestBody
    const email = body.email?.trim().toLowerCase()
    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
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

    if (!user || user.email?.toLowerCase() !== email) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { subject, html } = verificationEmailHtml(email)

    let status: 'sent' | 'failed' | 'skipped' = 'skipped'
    let errorMsg: string | null = null

    if (!brevoConfigured) {
      console.log(`[dev] Verification reminder for ${email} (Supabase Auth also sends verify email if SMTP configured)`)
      status = 'sent'
    } else {
      const result = await sendBrevoEmail({
        to: { email, name: email },
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
      p_type: 'email_verification',
      p_recipient_email: email,
      p_status: status,
      p_recipient_user_id: user.id,
      p_subject: subject,
      p_error_message: errorMsg,
      p_metadata: { source: 'send-verification-reminder' },
    })

    if (status === 'failed') {
      return new Response(JSON.stringify({ sent: false, error: errorMsg }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        sent: true,
        dev_mode: !brevoConfigured,
        note: 'Configure Supabase Auth SMTP for the official verification link email.',
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
