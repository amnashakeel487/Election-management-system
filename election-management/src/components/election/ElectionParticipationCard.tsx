import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { registerForElection } from '@/services/voterRegistrationService'
import type { ElectionRegistrationStats, VoterRegistration } from '@/types/voterRegistration'
import { SecretVoterIdDisplay } from '@/components/voter/SecretVoterIdDisplay'
import { formatTimeRemaining } from '@/utils/electionTime'

interface ElectionParticipationCardProps {
  electionId: string
  endDate: string
  stats: ElectionRegistrationStats
  userRegistration: VoterRegistration | null
  voterRollFinalized?: boolean
  canCastVote?: boolean
  onRegistrationChange: () => void
}

export function ElectionParticipationCard({
  electionId,
  endDate,
  stats,
  userRegistration,
  voterRollFinalized,
  canCastVote,
  onRegistrationChange,
}: ElectionParticipationCardProps) {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleParticipate() {
    if (!session) {
      navigate('/login', { state: { from: `/elections/${electionId}` } })
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const result = await registerForElection(electionId)

      if (result.duplicate) {
        setMessage(result.message ?? 'You are already registered for this election.')
        onRegistrationChange()
        return
      }

      if (result.status === 'registered') {
        setMessage('You are registered for this election. You can vote when polling opens.')
      } else {
        setMessage(
          `Election is at capacity. You have been added to the waitlist (position #${result.waitlist_position}).`,
        )
      }

      onRegistrationChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isFull = stats.registered_count >= stats.max_voters
  const alreadyRegistered = userRegistration?.status === 'registered'
  const onWaitlist = userRegistration?.status === 'waitlisted'

  return (
    <div className="glass rounded-[32px] border-primary/20 p-8">
      <div className="mb-8 text-center">
        <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">Ready to Vote?</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Ensure your biometric key is connected before proceeding.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-body-sm text-error">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-tertiary/30 bg-tertiary/10 px-md py-sm font-body-sm text-body-sm text-tertiary">
          {message}
        </p>
      ) : null}

      {alreadyRegistered ? (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-md py-4 text-center">
          <p className="font-label-md text-label-md text-primary">You are registered for this election</p>
          {userRegistration?.secret_voter_id ? (
            <SecretVoterIdDisplay
              secretVoterId={userRegistration.secret_voter_id}
              emailed={Boolean(userRegistration.secret_voter_id_emailed_at)}
              compact
            />
          ) : voterRollFinalized ? (
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              Secret voter ID pending assignment.
            </p>
          ) : (
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              Your Secret Voter ID will be issued after the organizer finalizes the voter roll.
            </p>
          )}
          {canCastVote && userRegistration?.secret_voter_id && !userRegistration.voted_at ? (
            <Link
              to={`/elections/${electionId}/vote`}
              className="mt-4 inline-block w-full rounded-xl bg-primary py-3 font-label-md text-label-md text-on-primary"
            >
              Cast Secure Ballot
            </Link>
          ) : null}
          {userRegistration?.voted_at ? (
            <p className="mt-2 font-body-sm text-body-sm text-tertiary">You have already voted in this election.</p>
          ) : null}
        </div>
      ) : null}

      {onWaitlist ? (
        <div className="mb-4 rounded-xl border border-secondary/30 bg-secondary/10 px-md py-4 text-center">
          <p className="font-label-md text-label-md text-secondary">
            On waitlist — position #{userRegistration.waitlist_position}
          </p>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            You will be notified if a spot opens.
          </p>
        </div>
      ) : null}

      {!alreadyRegistered && !onWaitlist ? (
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleParticipate()}
          className="mb-4 w-full rounded-xl bg-primary py-4 font-headline-md text-headline-md text-on-primary shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {submitting ? 'Processing…' : 'Join Election'}
        </button>
      ) : null}

      {isFull && !alreadyRegistered && !onWaitlist ? (
        <p className="mb-4 text-center font-body-sm text-body-sm text-on-surface-variant">
          Registration is full ({stats.registered_count}/{stats.max_voters}). Joining will add you to the
          waitlist.
        </p>
      ) : null}

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent py-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-white/5"
      >
        <span className="material-symbols-outlined">description</span>
        Terms &amp; Conditions
      </button>

      <div className="mt-8 border-t border-white/10 pt-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary/10">
            <span className="material-symbols-outlined text-tertiary">timer</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Closes In</p>
            <p className="tabular-nums font-headline-md text-headline-md text-on-surface">
              {formatTimeRemaining(endDate)}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">check_circle</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Security Audit Passed</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">check_circle</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Zero-Knowledge Enabled</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">lock</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Immutable Chain Records</span>
          </div>
        </div>
        {!session ? (
          <p className="mt-6 text-center font-body-sm text-body-sm text-on-surface-variant">
            <Link to="/login" state={{ from: `/elections/${electionId}` }} className="text-primary hover:underline">
              Sign in
            </Link>{' '}
            to participate
          </p>
        ) : null}
      </div>
    </div>
  )
}
