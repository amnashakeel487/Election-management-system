import { Link } from 'react-router-dom'
import type { Election } from '@/types/election'
import { formatSubmissionDate } from '@/utils/formatDate'

interface CreatorElectionsTableProps {
  elections: Election[]
  finalizingId?: string | null
  onFinalizeVoterRoll?: (electionId: string) => void
}

function statusBadge(status: Election['status']) {
  switch (status) {
    case 'published':
    case 'active':
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {status === 'published' ? 'Published' : 'Active'}
        </div>
      )
    case 'draft':
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold uppercase text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-on-surface-variant" />
          Draft
        </div>
      )
    case 'completed':
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-tertiary/10 px-3 py-1 text-[11px] font-bold uppercase text-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          Completed
        </div>
      )
    default:
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold uppercase text-on-surface-variant">
          {status}
        </div>
      )
  }
}

export function CreatorElectionsTable({
  elections,
  finalizingId,
  onFinalizeVoterRoll,
}: CreatorElectionsTableProps) {
  return (
    <div className="glass-panel flex flex-col overflow-hidden rounded-[32px] lg:col-span-2">
      <div className="flex items-center justify-between border-b border-white/10 p-6">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Recent Elections</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Manage and monitor your ongoing voting processes.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border border-white/10 p-2 transition-all hover:bg-white/5">
            <span className="material-symbols-outlined text-[20px] text-on-surface">filter_list</span>
          </button>
          <button type="button" className="rounded-lg border border-white/10 p-2 transition-all hover:bg-white/5">
            <span className="material-symbols-outlined text-[20px] text-on-surface">search</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high/50">
            <tr>
              <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Election Name
              </th>
              <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Voters
              </th>
              <th className="px-6 py-4 text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {elections.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center font-body-sm text-body-sm text-on-surface-variant">
                  No elections yet. Create your first election.
                </td>
              </tr>
            ) : (
              elections.map((election) => (
                <tr key={election.id} className="group transition-colors hover:bg-white/5">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          election.status === 'draft'
                            ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-on-surface-variant/10 text-on-surface-variant'
                            : 'flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary'
                        }
                      >
                        <span className="material-symbols-outlined">
                          {election.status === 'draft' ? 'gavel' : 'account_balance'}
                        </span>
                      </div>
                      <div>
                        <p className="font-body-md text-body-md font-semibold text-on-surface">{election.title}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {election.status === 'draft'
                            ? `Created: ${formatSubmissionDate(election.created_at)}`
                            : `Starts: ${formatSubmissionDate(election.start_date)}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">{statusBadge(election.status)}</td>
                  <td className="px-6 py-5">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      max {election.max_voters.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {election.status === 'draft' ? (
                        <Link
                          to={`/creator/elections/${election.id}/edit`}
                          className="rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-95"
                        >
                          Edit
                        </Link>
                      ) : null}
                      {(election.status === 'published' || election.status === 'active') &&
                      !election.voter_roll_finalized_at &&
                      onFinalizeVoterRoll ? (
                        <button
                          type="button"
                          disabled={finalizingId === election.id}
                          onClick={() => onFinalizeVoterRoll(election.id)}
                          className="rounded-lg border border-tertiary/30 bg-tertiary/10 px-4 py-2 font-label-md text-label-md text-tertiary transition-all hover:bg-tertiary/20 disabled:opacity-60"
                        >
                          {finalizingId === election.id ? 'Finalizing…' : 'Finalize & Email IDs'}
                        </button>
                      ) : null}
                      {election.status !== 'draft' ? (
                        <Link
                          to={`/elections/${election.id}/results`}
                          className="rounded-lg border border-white/10 px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-white/10"
                        >
                          Results
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-auto flex justify-center border-t border-white/5 p-6">
        <Link to="/creator/elections/new" className="flex items-center gap-2 font-label-md text-label-md text-primary hover:underline">
          Create New Election
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
