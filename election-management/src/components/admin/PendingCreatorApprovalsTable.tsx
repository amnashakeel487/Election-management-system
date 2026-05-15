import type { PendingCreatorRequest } from '@/types/auth'
import { formatSubmissionDate } from '@/utils/formatDate'

interface PendingCreatorApprovalsTableProps {
  requests: PendingCreatorRequest[]
  actingOnId: string | null
  onApprove: (id: string, email: string) => void
  onReject: (id: string, email: string) => void
}

export function PendingCreatorApprovalsTable({
  requests,
  actingOnId,
  onApprove,
  onReject,
}: PendingCreatorApprovalsTableProps) {
  return (
    <div className="col-span-12 overflow-hidden rounded-[24px] border border-white/5 bg-surface-container lg:col-span-8">
      <div className="flex items-center justify-between border-b border-white/5 p-lg">
        <h3 className="font-headline-md text-headline-md text-on-surface">Pending Election Approvals</h3>
        <a className="font-label-md text-label-md text-primary hover:underline" href="#">
          View All
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-high/50 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <th className="px-lg py-4">Election Name</th>
              <th className="px-lg py-4">Submitted By</th>
              <th className="px-lg py-4">Region</th>
              <th className="px-lg py-4">Submission Date</th>
              <th className="px-lg py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-lg py-8 text-center font-body-sm text-body-sm text-on-surface-variant">
                  No pending creator requests.
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const busy = actingOnId === request.id
                const displayName = request.full_name ?? request.email
                return (
                  <tr key={request.id} className="group transition-colors hover:bg-white/5">
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-highest">
                          <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface">{displayName}</span>
                      </div>
                    </td>
                    <td className="px-lg py-4 font-body-sm text-body-sm text-on-surface-variant">{request.email}</td>
                    <td className="px-lg py-4 font-body-sm text-body-sm text-on-surface-variant">Creator Access</td>
                    <td className="px-lg py-4 font-body-sm text-body-sm text-on-surface-variant">
                      {formatSubmissionDate(request.created_at)}
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onReject(request.id, request.email)}
                          className="rounded-lg border border-error/30 px-3 py-1.5 font-label-sm text-label-sm text-error transition-all hover:bg-error/10 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onApprove(request.id, request.email)}
                          className="rounded-lg bg-primary/10 px-4 py-1.5 font-label-sm text-label-sm text-primary transition-all hover:bg-primary hover:text-on-primary disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
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
