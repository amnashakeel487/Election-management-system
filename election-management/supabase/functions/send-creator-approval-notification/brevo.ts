export interface BrevoSender {
  name: string
  email: string
}

export function getBrevoApiKey(): string | undefined {
  return Deno.env.get('BREVO_API_KEY')?.trim() || undefined
}

export function parseSender(fromRaw: string, defaultName = 'FortressVote'): BrevoSender {
  const trimmed = fromRaw.trim()
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() }
  }
  return { name: defaultName, email: trimmed }
}

export function getBrevoSender(fallbackFrom?: string): BrevoSender {
  const email = Deno.env.get('BREVO_SENDER_EMAIL')?.trim()
  const name = Deno.env.get('BREVO_SENDER_NAME')?.trim() || 'FortressVote'
  if (email) {
    return { name, email }
  }
  const fromEnv = fallbackFrom?.trim()
  if (fromEnv) {
    return parseSender(fromEnv, name)
  }
  throw new Error('Set BREVO_SENDER_EMAIL in Supabase Edge Function secrets')
}

export async function sendBrevoEmail(params: {
  to: { email: string; name?: string }
  subject: string
  htmlContent: string
  sender?: BrevoSender
  fallbackFrom?: string
}): Promise<{ ok: true } | { ok: false; error: string; devMode?: boolean }> {
  const apiKey = getBrevoApiKey()
  if (!apiKey) {
    return { ok: false, error: 'BREVO_API_KEY not set', devMode: true }
  }

  let sender: BrevoSender
  try {
    sender = params.sender ?? getBrevoSender(params.fallbackFrom)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Sender not configured' }
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: params.to.email, name: params.to.name ?? params.to.email }],
      subject: params.subject,
      htmlContent: params.htmlContent,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { ok: false, error: errText }
  }

  return { ok: true }
}
