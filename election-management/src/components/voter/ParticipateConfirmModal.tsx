import { useEffect, useRef } from 'react'
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
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  if (!open) return null

  const deadline = election.registration_deadline ?? election.start_date

  return (
    <dialog
      ref={dialogRef}
      className="vr-modal w-[min(100%,28rem)] max-w-lg rounded-2xl border border-[#e2e8f0] bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/60"
      onClose={onCancel}
    >
      <div className="border-b border-[#e2e8f0] bg-gradient-to-br from-[#0F2347] via-[#1B3A6B] to-[#2D1B69] px-5 py-4 text-white">
        <h2 className="text-lg font-extrabold tracking-tight">Confirm participation</h2>
        <p className="mt-1 text-xs text-white/55">Review before joining this election</p>
      </div>
      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Election</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900">{election.title}</p>
        </div>
        <div className="rounded-xl border border-[#e2e8f0] bg-slate-50/90 px-3 py-2.5 text-xs text-slate-600">
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
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            This election is at capacity ({stats.registered_count}/{stats.max_voters}). Confirming will add
            you to the <strong>waitlist</strong> in order of registration.
          </p>
        ) : (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-emerald-900">
            {stats.max_voters - stats.registered_count} spot
            {stats.max_voters - stats.registered_count === 1 ? '' : 's'} remaining. You will be registered
            immediately.
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-slate-500">
          By confirming, you accept the election terms and certify that you meet the eligibility requirements.
          Your participation is recorded securely; duplicate registrations are not allowed.
        </p>
      </div>
      <div className="flex gap-2 border-t border-[#e2e8f0] px-5 py-4">
        <button
          type="button"
          className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] py-2.5 text-sm font-bold text-white hover:opacity-95 disabled:opacity-60"
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? 'Joining…' : 'Yes, I want to participate'}
        </button>
      </div>
    </dialog>
  )
}
