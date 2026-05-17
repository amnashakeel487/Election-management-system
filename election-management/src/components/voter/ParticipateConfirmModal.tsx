import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Election } from '@/types/election'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'
import { eligibilityRuleDescription } from '@/utils/voterRegistrationEligibility'

interface ParticipateConfirmModalProps {
  open: boolean
  election: Election
  stats: ElectionRegistrationStats
  willWaitlist: boolean
  submitting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ParticipateConfirmModal({
  open,
  election,
  stats,
  willWaitlist,
  submitting,
  onConfirm,
  onCancel,
}: ParticipateConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, submitting, onCancel])

  if (!open) return null

  const deadline = election.registration_deadline ?? election.start_date

  return createPortal(
    <div
      className="vr-modal-overlay"
      role="presentation"
      onClick={() => {
        if (!submitting) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="participate-confirm-title"
        className="vr-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vr-modal-header">
          <h2 id="participate-confirm-title" className="vr-modal-title">
            Confirm participation
          </h2>
          <p className="vr-modal-subtitle">Review before joining this election</p>
        </div>
        <div className="vr-modal-body">
          <div>
            <p className="vr-modal-label">Election</p>
            <p className="vr-modal-election-title">{election.title}</p>
          </div>
          <div className="vr-modal-info">
            <p>
              <span className="font-semibold text-slate-800">Eligibility:</span>{' '}
              {eligibilityRuleDescription(election.eligibility_rule)}
            </p>
            <p className="mt-1.5">
              <span className="font-semibold text-slate-800">Registration closes:</span>{' '}
              {new Date(deadline).toLocaleString()}
            </p>
          </div>
          {willWaitlist ? (
            <p className="vr-modal-notice vr-modal-notice--warn">
              This election is at capacity ({stats.registered_count}/{stats.max_voters}). Confirming will add
              you to the <strong>waitlist</strong> in order of registration.
            </p>
          ) : (
            <p className="vr-modal-notice vr-modal-notice--ok">
              {stats.max_voters - stats.registered_count} spot
              {stats.max_voters - stats.registered_count === 1 ? '' : 's'} remaining. You will be registered
              immediately.
            </p>
          )}
          <p className="vr-modal-legal">
            By confirming, you accept the election terms and certify that you meet the eligibility requirements.
            Your participation is recorded securely; duplicate registrations are not allowed.
          </p>
        </div>
        <div className="vr-modal-footer">
          <button type="button" className="vr-modal-btn vr-modal-btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="vr-modal-btn vr-modal-btn--primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Joining…' : 'Yes, I want to participate'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
