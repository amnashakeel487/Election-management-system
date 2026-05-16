import { useState } from 'react'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'

interface SecretVoterIdDisplayProps {
  secretVoterId: string
  emailed?: boolean
  compact?: boolean
}

export function SecretVoterIdDisplay({ secretVoterId, emailed, compact }: SecretVoterIdDisplayProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className={compact ? 'mt-2' : 'mt-3 rounded-xl border border-line bg-surface-container-low px-md py-3'}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Secret Voter ID
          </p>
          <p className="font-mono text-body-md text-on-surface tabular-nums">
            {revealed ? secretVoterId : maskSecretVoterId(secretVoterId)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="rounded-lg border border-line px-3 py-1.5 font-label-sm text-label-sm text-primary hover:bg-primary/10"
        >
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
      {emailed ? (
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          A copy was sent to your email.
        </p>
      ) : (
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Your ID will be emailed after the organizer finalizes the voter roll.
        </p>
      )}
    </div>
  )
}
