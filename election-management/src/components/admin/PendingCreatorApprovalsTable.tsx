import { useState } from 'react'
import type { PendingCreatorRequest } from '@/types/auth'
import { formatSubmissionDate } from '@/utils/formatDate'

interface PendingCreatorApprovalsTableProps {
  requests: PendingCreatorRequest[]
  actingOnId: string | null
  onReview?: (request: PendingCreatorRequest) => void
  onApprove: (id: string, email: string) => void
  onReject: (id: string, email: string, reason: string) => void
}

export function PendingCreatorApprovalsTable({
  requests,
  actingOnId,
  onReview,
  onApprove,
  onReject,
}: PendingCreatorApprovalsTableProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function submitReject(id: string, email: string) {
    if (rejectReason.trim().length < 10) return
    onReject(id, email, rejectReason.trim())
    setRejectingId(null)
    setRejectReason('')
  }

  return (
    <div className="col-span-12 overflow-hidden rounded-[24px] border border-white/5 bg-surface-container lg:col-span-8">
      <div className="flex items-center justify-between border-b border-white/5 p-lg">
        <h3 className="font-headline-md text-headline-md text-on-surface">Pending Creator Requests</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-high/50 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <th className="px-lg py-4">Name</th>
              <th className="px-lg py-4">Email / Phone</th>
              <th className="px-lg py-4">Organization</th>
              <th className="px-lg py-4">Purpose</th>
              <th className="px-lg py-4">Submitted</th>
              <th className="px-lg py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-lg py-8 text-center font-body-sm text-body-sm text-on-surface-variant">
                  No pending creator requests.
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const busy = actingOnId === request.id
                return (
                  <tr key={request.id} className="group transition-colors hover:bg-white/5">
                    <td className="px-lg py-4 font-body-sm text-on-surface">{request.full_name ?? '—'}</td>
                    <td className="px-lg py-4 font-body-sm text-on-surface-variant">
                      <div>{request.email}</div>
                      <div className="text-[11px]">{request.phone ?? '—'}</div>
                    </td>
                    <td className="max-w-[140px] truncate px-lg py-4 font-body-sm text-on-surface-variant">
                      {request.organization ?? '—'}
                    </td>
                    <td className="max-w-[180px] truncate px-lg py-4 font-body-sm text-on-surface-variant">
                      {request.election_purpose ?? '—'}
                    </td>
                    <td className="px-lg py-4 font-body-sm text-on-surface-variant">
                      {formatSubmissionDate(request.created_at)}
                    </td>
                    <td className="px-lg py-4 text-right">
                      {rejectingId === request.id ? (
                        <div className="flex flex-col items-end gap-2">
                          <input
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason"
                            className="w-full max-w-xs rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm"
                          />
                          <div className="flex gap-2">
                            <button type="button" className="text-xs text-on-surface-variant" onClick={() => setRejectingId(null)}>
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => submitReject(request.id, request.email)}
                              className="rounded-lg bg-error/20 px-3 py-1 text-xs text-error"
                            >
                              Confirm reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {onReview ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => onReview(request)}
                              className="rounded-lg border border-white/10 px-3 py-1.5 font-label-sm text-on-surface-variant hover:text-on-surface"
                            >
                              Review
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setRejectingId(request.id)}
                            className="rounded-lg border border-error/30 px-3 py-1.5 font-label-sm text-error hover:bg-error/10 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onApprove(request.id, request.email)}
                            className="rounded-lg bg-primary/10 px-4 py-1.5 font-label-sm text-primary hover:bg-primary hover:text-on-primary disabled:opacity-50"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
