import { getServiceAdmin, enforceEdgeRateLimit } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  token?: string
  action?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const secret = Deno.env.get('TURNSTILE_SECRET_KEY')?.trim()
    const body = (await req.json()) as RequestBody
    const token = body.token?.trim()

    const authHeader = req.headers.get('Authorization')
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateBucket = `captcha:${ip}:${body.action ?? 'auth'}`

    const admin = getServiceAdmin()
    const limited = await enforceEdgeRateLimit(admin, rateBucket, 30, 60)
    if (!limited.ok) {
      return new Response(JSON.stringify({ ok: false, error: limited.error }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!secret) {
      if (!token || token === 'checkbox-fallback') {
        return new Response(
          JSON.stringify({ ok: true, mode: 'checkbox_fallback', note: 'TURNSTILE_SECRET_KEY not set' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ ok: false, error: 'CAPTCHA not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'CAPTCHA token required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const form = new URLSearchParams()
    form.set('secret', secret)
    form.set('response', token)
    if (authHeader) {
      /* optional: pass remoteip if available */
    }
    if (ip !== 'unknown') form.set('remoteip', ip)

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })

    const result = (await verifyRes.json()) as { success?: boolean; 'error-codes'?: string[] }

    if (!result.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'CAPTCHA verification failed',
          codes: result['error-codes'] ?? [],
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ ok: true, mode: 'turnstile' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
