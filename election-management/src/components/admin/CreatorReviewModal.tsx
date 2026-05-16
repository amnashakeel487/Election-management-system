import { useState } from 'react'
import type { PendingCreatorRequest } from '@/types/auth'
import { formatSubmissionDate } from '@/utils/formatDate'

interface CreatorReviewModalProps {
  request: PendingCreatorRequest
  acting: boolean
  onClose: () => void
  onApprove: () => void
  onReject: (reason: string) => void
}

export function CreatorReviewModal({
  request,
  acting,
  onClose,
  onApprove,
  onReject,
}: CreatorReviewModalProps) {
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  function handleReject() {
    if (rejectReason.trim().length < 10) {
      setLocalError('Please provide a rejection reason (at least 10 characters).')
      return
    }
    setLocalError(null)
    onReject(rejectReason.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="creator-review-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-line bg-surface-container p-lg shadow-2xl"
      >
        <div className="mb-lg flex items-start justify-between gap-md">
          <div>
            <h2 id="creator-review-title" className="font-headline-lg text-headline-lg text-on-surface">
              Review Creator Request
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Submitted {formatSubmissionDate(request.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={acting}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-elevated/50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <dl className="space-y-md rounded-xl border border-line bg-surface-container-low p-md">
          <DetailRow label="Full name" value={request.full_name} />
          <DetailRow label="Email" value={request.email} />
          <DetailRow label="Phone" value={request.phone} />
          <DetailRow label="Organization" value={request.organization} />
          <DetailRow label="Election purpose" value={request.election_purpose} multiline />
        </dl>

        {localError ? (
          <p className="mt-md rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-error">
            {localError}
          </p>
        ) : null}

        {rejectMode ? (
          <div className="mt-lg space-y-sm">
            <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="reject-reason">
              Rejection reason (required)
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this application cannot be approved…"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              The applicant will receive this reason by email.
            </p>
            <div className="flex gap-sm">
              <button
                type="button"
                disabled={acting}
                onClick={() => {
                  setRejectMode(false)
                  setRejectReason('')
                  setLocalError(null)
                }}
                className="flex-1 rounded-xl border border-outline-variant py-md font-label-md text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={handleReject}
                className="flex-1 rounded-xl bg-error py-md font-label-md text-on-error"
              >
                {acting ? 'Sending…' : 'Confirm rejection'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-lg flex flex-col gap-sm sm:flex-row">
            <button
              type="button"
              disabled={acting}
              onClick={() => setRejectMode(true)}
              className="flex-1 rounded-xl border border-error/40 py-md font-label-md text-error hover:bg-error/10"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={onApprove}
              className="flex-1 rounded-xl bg-primary py-md font-label-md text-on-primary"
            >
              {acting ? 'Processing…' : 'Approve creator'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string
  value: string | null | undefined
  multiline?: boolean
}) {
  return (
    <div>
      <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</dt>
      <dd
        className={`mt-xs font-body-md text-body-md text-on-surface ${multiline ? 'whitespace-pre-wrap' : ''}`}
      >
        {value?.trim() || '—'}
      </dd>
    </div>
  )
}
