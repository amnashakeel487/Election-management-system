import type { CandidateResultRow } from '@/types/electionResults'
import { RESULTS_CHART_COLORS } from '@/constants/resultsChartColors'

interface ResultsCandidateTableProps {
  candidates: CandidateResultRow[]
  totalVotes: number
  leaderIds: Set<string>
}

export function ResultsCandidateTable({ candidates, totalVotes, leaderIds }: ResultsCandidateTableProps) {
  return (
    <div className="glass-panel overflow-hidden rounded-[32px]">
      <div className="border-b border-line p-6">
        <h3 className="font-headline-md text-headline-md text-on-surface">Candidate Breakdown</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Live tallies from anonymous ballots</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high/50">
            <tr>
              <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Rank
              </th>
              <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Candidate
              </th>
              <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Votes
              </th>
              <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Share
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {candidates.map((c, index) => {
              const percent = totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 1000) / 10 : 0
              const isLeader = leaderIds.has(c.candidate_id)
              const color = RESULTS_CHART_COLORS[index % RESULTS_CHART_COLORS.length]
              return (
                <tr key={c.candidate_id} className="hover:bg-elevated/40">
                  <td className="px-6 py-4 font-body-md text-on-surface-variant">#{index + 1}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                      <div>
                        <p className="font-body-md font-semibold text-on-surface">{c.name}</p>
                        {isLeader ? (
                          <span className="font-label-sm text-label-sm text-tertiary">Leader</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-headline-md text-headline-md text-on-surface">
                    {c.vote_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex max-w-[140px] flex-col gap-1">
                      <span className="font-label-md text-label-md text-on-surface">{percent}%</span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-elevated/50">
                        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
