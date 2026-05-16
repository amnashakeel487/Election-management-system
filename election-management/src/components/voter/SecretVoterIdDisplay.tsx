import { useState } from 'react'
import { emailMySecretVoterId } from '@/services/secretVoterIdService'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'
import { exampleSecretVoterIds } from '@/utils/secretVoterId'

interface SecretVoterIdDisplayProps {
  secretVoterId: string
  electionId?: string
  pollPrefix?: string
  emailed?: boolean
  compact?: boolean
  onEmailed?: () => void
}

export function SecretVoterIdDisplay({
  secretVoterId,
  electionId,
  pollPrefix,
  emailed,
  compact,
  onEmailed,
}: SecretVoterIdDisplayProps) {
  const [revealed, setRevealed] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const masked = maskSecretVoterId(secretVoterId)
  const formatHint = pollPrefix ? exampleSecretVoterIds(pollPrefix).first : null

  async function handleResendEmail() {
    if (!electionId) return
    setSending(true)
    setEmailError(null)
    setEmailMessage(null)
    try {
      const result = await emailMySecretVoterId(electionId)
      if (result.sent > 0) {
        setEmailMessage('Secret ID sent to your email.')
        onEmailed?.()
      } else if (result.dev_mode) {
        setEmailMessage('Dev mode: check function logs for your ID (set BREVO_API_KEY in Supabase — see docs/AUTH_SETUP.md).')
        onEmailed?.()
      } else {
        setEmailError('Could not send email. Try again or contact the election organizer.')
      }
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Email failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={compact ? 'mt-2' : 'mt-3 rounded-xl border border-[#e2e8f0] bg-slate-50/80 px-3 py-3'}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Secret Voter ID
          </p>
          <p
            className="font-mono text-body-md text-on-surface tabular-nums"
            aria-label={revealed ? 'Full secret voter ID' : 'Masked secret voter ID'}
          >
            {revealed ? secretVoterId : masked}
          </p>
          {!revealed ? (
            <p className="mt-0.5 text-[10px] text-on-surface-variant">
              Masked on screen ({masked}) — reveal only in private
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="rounded-lg border border-line px-3 py-1.5 font-label-sm text-label-sm text-primary hover:bg-primary/10"
          >
            {revealed ? 'Hide' : 'Reveal'}
          </button>
          {electionId && emailed ? (
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleResendEmail()}
              className="rounded-lg border border-line px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant hover:bg-elevated/50 disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Email again'}
            </button>
          ) : null}
        </div>
      </div>

      {formatHint ? (
        <p className="mt-1 text-[10px] text-on-surface-variant">
          This poll uses format <span className="font-mono">{formatHint}</span> — your ID is unique to this election.
        </p>
      ) : null}

      {emailError ? (
        <p className="mt-2 text-[11px] text-error">{emailError}</p>
      ) : null}
      {emailMessage ? (
        <p className="mt-2 text-[11px] text-tertiary">{emailMessage}</p>
      ) : null}

      {emailed ? (
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          A copy was sent to your email. Each new poll issues a different secret ID.
        </p>
      ) : (
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Your ID will be emailed after the organizer finalizes the voter roll.
        </p>
      )}
    </div>
  )
}
