import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { WaitlistStatusBanner } from '@/components/waitlist/WaitlistStatusBanner'
import { withdrawFromElection } from '@/services/waitlistService'
import { registerForElection } from '@/services/voterRegistrationService'
import { useTranslation } from 'react-i18next'
import { useWaitlistMessage } from '@/hooks/useWaitlistMessage'
import type { Election } from '@/types/election'
import type { ElectionRegistrationStats, VoterRegistration } from '@/types/voterRegistration'
import { SecretVoterIdDisplay } from '@/components/voter/SecretVoterIdDisplay'
import { ParticipateConfirmModal } from '@/components/voter/ParticipateConfirmModal'
import { buildRegistrationEligibility, eligibilityRuleDescription } from '@/utils/voterRegistrationEligibility'
import { registrationStatusLabel } from '@/utils/registrationLock'
import { formatTimeRemaining } from '@/utils/electionTime'
import { isPollingOpen } from '@/utils/electionPolling'
import './voter-registration-panel.css'

export interface VoterRegistrationPanelProps {
  election: Election
  stats: ElectionRegistrationStats
  userRegistration: VoterRegistration | null
  voterRollFinalized?: boolean
  canCastVote?: boolean
  onRegistrationChange: () => void
  className?: string
}

export function VoterRegistrationPanel({
  election,
  stats,
  userRegistration,
  voterRollFinalized,
  canCastVote,
  onRegistrationChange,
  className = '',
}: VoterRegistrationPanelProps) {
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const { t: tWaitlist } = useTranslation('waitlist')
  const formatWaitlist = useWaitlistMessage()

  const eligibility = useMemo(
    () =>
      buildRegistrationEligibility({
        election,
        stats,
        userRegistration,
        sessionUserId: session?.user.id,
        profile,
      }),
    [election, stats, userRegistration, session?.user.id, profile],
  )

  const alreadyRegistered = userRegistration?.status === 'registered'
  const onWaitlist = userRegistration?.status === 'waitlisted'
  const rollStatus = registrationStatusLabel(election)
  const canJoin = eligibility.canRegister
  const needsSignIn = eligibility.needsSignIn
  const showParticipateForm = !alreadyRegistered && !onWaitlist && canJoin
  const showSignInToRegister = !alreadyRegistered && !onWaitlist && needsSignIn
  const showRegistrationClosed =
    !alreadyRegistered && !onWaitlist && !canJoin && !needsSignIn

  function openConfirm() {
    if (!session) {
      navigate('/login', { state: { from: `/elections/${election.id}` } })
      return
    }
    if (!termsAccepted) {
      setError('Please accept the terms and eligibility confirmation.')
      return
    }
    if (!eligibility.canRegister) {
      setError(eligibility.blockReason ?? 'You are not eligible to register.')
      return
    }
    setError(null)
    setConfirmOpen(true)
  }

  async function handleConfirmParticipate() {
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const result = await registerForElection(election.id)

      if (result.duplicate) {
        setMessage(result.message ?? 'You are already registered for this election.')
        setConfirmOpen(false)
        onRegistrationChange()
        return
      }

      if (result.status === 'registered') {
        setMessage(
          'You are registered for this election. Check Notifications — we will alert you when voting opens.',
        )
      } else {
        setMessage(formatWaitlist(result.waitlist_position))
      }

      setConfirmOpen(false)
      setTermsAccepted(false)
      onRegistrationChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setConfirmOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const joinDisabled = submitting || !termsAccepted

  return (
    <>
      <div className={`vr-panel ed-participation-card ${className}`.trim()}>
        <div className="mb-4">
          <h3 className="vr-panel-title">Join this election</h3>
          <p className="vr-panel-sub">
            Register to participate. Duplicate registrations are blocked; if capacity is full you will be
            waitlisted automatically.
          </p>
        </div>

        {error ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="mb-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">{message}</p>
        ) : null}

        <div className="vr-meta-grid">
          <div className="vr-meta-cell">
            <p className="vr-meta-label">Registration closes</p>
            <p className="vr-meta-value">
              {eligibility.checks.find((c) => c.id === 'before_deadline')?.passed
                ? formatTimeRemaining(eligibility.registrationDeadline)
                : 'Closed'}
            </p>
          </div>
          <div className="vr-meta-cell">
            <p className="vr-meta-label">Capacity</p>
            <p className="vr-meta-value">
              {stats.registered_count}/{stats.max_voters}
              {stats.waitlist_count > 0 ? ` · ${stats.waitlist_count} waitlisted` : ''}
            </p>
          </div>
        </div>

        {rollStatus.tone !== 'open' ? (
          <p
            className={`mb-3 rounded-lg px-3 py-2 text-[11px] ${
              rollStatus.tone === 'finalized'
                ? 'border border-violet-200 bg-violet-50 text-violet-900'
                : 'border border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <span className="material-symbols-outlined mr-1 align-middle text-[14px]">lock</span>
            {rollStatus.label}
          </p>
        ) : null}

        <p className="mb-3 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Rule:</span>{' '}
          {eligibilityRuleDescription(election.eligibility_rule)}
        </p>

        {!alreadyRegistered &&
        !onWaitlist &&
        (showParticipateForm || showSignInToRegister || showRegistrationClosed) ? (
          <ul className="mb-4 space-y-2" aria-label="Eligibility checklist">
            {eligibility.checks.map((check) => (
              <li
                key={check.id}
                className={`vr-check ${check.passed ? 'vr-check--pass' : 'vr-check--fail'}`}
              >
                <span className="material-symbols-outlined vr-check-icon">
                  {check.passed ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>
                  {check.label}
                  {check.detail ? <span className="block text-[10px] text-slate-400">{check.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {alreadyRegistered ? (
          <div className="vr-status-box vr-status-box--registered mb-4">
            <p className="font-bold">You are registered</p>
            {userRegistration?.secret_voter_id ? (
              <div className="mt-3 text-left">
                <SecretVoterIdDisplay
                  secretVoterId={userRegistration.secret_voter_id}
                  electionId={election.id}
                  pollPrefix={election.secret_voter_id_prefix}
                  emailed={Boolean(userRegistration.secret_voter_id_emailed_at)}
                  compact
                  onEmailed={onRegistrationChange}
                />
              </div>
            ) : voterRollFinalized ? (
              <p className="mt-2 text-xs opacity-80">Secret voter ID pending assignment.</p>
            ) : (
              <p className="mt-2 text-xs opacity-80">
                Your secret voter ID will be issued after the organizer finalizes the voter roll.
              </p>
            )}
            {canCastVote && userRegistration?.secret_voter_id && !userRegistration.voted_at ? (
              <Link
                to={`/voter/vote/${election.id}`}
                className="mt-4 inline-block w-full rounded-xl bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] py-2.5 text-center text-sm font-bold text-white no-underline"
              >
                Cast secure ballot
              </Link>
            ) : null}
            {userRegistration?.voted_at ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">You have already voted.</p>
            ) : null}
          </div>
        ) : null}

        {onWaitlist ? (
          <WaitlistStatusBanner
            className="mb-4"
            position={userRegistration?.waitlist_position}
            withdrawing={withdrawing}
            onWithdraw={() => {
              if (!window.confirm('Leave the waitlist for this election?')) return
              setWithdrawing(true)
              setError(null)
              void withdrawFromElection(election.id)
                .then(() => {
                  setMessage(tWaitlist('leftWaitlist'))
                  onRegistrationChange()
                })
                .catch((err) =>
                  setError(err instanceof Error ? err.message : 'Could not leave waitlist'),
                )
                .finally(() => setWithdrawing(false))
            }}
          />
        ) : null}

        {showSignInToRegister ? (
          <div className="vr-status-box vr-status-box--sign-in mb-4 text-left">
            <p className="font-bold text-[#1B3A6B]">Registration is open</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Sign in with your voter account to join this election. We will confirm your registration and notify you
              when voting opens.
            </p>
            {eligibility.willWaitlist ? (
              <p className="mt-2 text-[11px] text-amber-800">
                Capacity is full — you may be added to the waitlist after sign-in.
              </p>
            ) : eligibility.spotsRemaining > 0 ? (
              <p className="mt-2 text-[11px] text-emerald-800">
                {eligibility.spotsRemaining} spot{eligibility.spotsRemaining === 1 ? '' : 's'} remaining.
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/login"
                state={{ from: `/elections/${election.id}` }}
                className="vr-btn-primary inline-block text-center no-underline"
              >
                Sign in to participate
              </Link>
              <Link
                to="/register"
                state={{ from: `/elections/${election.id}` }}
                className="vr-btn-secondary inline-block text-center no-underline"
              >
                Create voter account
              </Link>
            </div>
          </div>
        ) : null}

        {showRegistrationClosed ? (
          <div className="vr-status-box vr-status-box--closed mb-4 text-left">
            <p className="font-bold text-violet-900">Registration is closed</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {eligibility.blockReason ??
                'You cannot join this election right now.'}
            </p>
            {election.voter_roll_finalized_at ? (
              <p className="mt-2 text-xs text-slate-500">
                The organizer finalized the voter roll with {stats.registered_count.toLocaleString()} registered
                voter{stats.registered_count === 1 ? '' : 's'}. New participants cannot be added after finalization.
                Contact the election organizer if you believe this was done in error.
              </p>
            ) : election.registration_locked_at ? (
              <p className="mt-2 text-xs text-slate-500">
                Registration was locked before you could join. The organizer or an administrator must reopen it.
              </p>
            ) : null}
          </div>
        ) : null}

        {showParticipateForm ? (
          <>
            {eligibility.willWaitlist ? (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                Registration is full. Joining now adds you to the waitlist in order received.
              </p>
            ) : eligibility.spotsRemaining > 0 ? (
              <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
                {eligibility.spotsRemaining} registration spot{eligibility.spotsRemaining === 1 ? '' : 's'} left.
              </p>
            ) : null}

            <label className="mb-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#e2e8f0] bg-slate-50/80 p-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#2451A3]"
              />
              <span className="text-[11px] leading-relaxed text-slate-600">
                I accept the{' '}
                <a href="#" className="font-semibold text-[#2451A3] no-underline hover:underline">
                  terms and conditions
                </a>{' '}
                and confirm I meet the eligibility requirements for this election.
              </span>
            </label>

            <button
              type="button"
              disabled={joinDisabled}
              onClick={openConfirm}
              className="vr-btn-primary"
              title={!termsAccepted ? 'Accept the terms to continue' : undefined}
            >
              {submitting ? 'Processing…' : eligibility.willWaitlist ? 'Join waitlist' : 'I want to participate'}
            </button>
          </>
        ) : null}

        {!session && !alreadyRegistered && !onWaitlist && !showSignInToRegister ? (
          <p className="mt-3 text-center text-[11px] text-slate-500">
            <Link to="/login" state={{ from: `/elections/${election.id}` }} className="font-bold text-[#2451A3]">
              Sign in
            </Link>{' '}
            or{' '}
            <Link to="/register" className="font-bold text-[#2451A3]">
              create a voter account
            </Link>{' '}
            to join this election.
          </p>
        ) : null}

        {session ? (
          <Link
            to="/voter/elections"
            className="vr-btn-secondary mt-3 inline-block text-center no-underline"
          >
            My registrations
          </Link>
        ) : null}

        <div className="mt-5 border-t border-[#e2e8f0] pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[16px] text-[#2451A3]">timer</span>
            <span>
              Polls {isPollingOpen(election) ? 'open' : 'close'} in {formatTimeRemaining(election.end_date)}
            </span>
          </div>
        </div>
      </div>

      <ParticipateConfirmModal
        open={confirmOpen}
        election={election}
        stats={stats}
        willWaitlist={eligibility.willWaitlist}
        submitting={submitting}
        onConfirm={() => void handleConfirmParticipate()}
        onCancel={() => !submitting && setConfirmOpen(false)}
      />
    </>
  )
}
