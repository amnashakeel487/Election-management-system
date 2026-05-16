import type { CandidateResultRow } from '@/types/electionResults'
import { RESULTS_CHART_COLORS } from '@/constants/resultsChartColors'
import { enrichCandidatesWithShare } from '@/utils/resultsDisplay'

interface ResultsCandidateProgressListProps {
  candidates: CandidateResultRow[]
  totalVotes: number
  leaderIds: Set<string>
}

export function ResultsCandidateProgressList({
  candidates,
  totalVotes,
  leaderIds,
}: ResultsCandidateProgressListProps) {
  const rows = enrichCandidatesWithShare(candidates, totalVotes)

  return (
    <div className="glass-panel rounded-[24px] p-6">
      <h3 className="mb-1 font-headline-md text-headline-md text-on-surface">Candidate results</h3>
      <p className="mb-6 font-body-sm text-body-sm text-on-surface-variant">
        Live vote share per candidate
      </p>
      <ul className="space-y-5">
        {rows.map((c, index) => {
          const color = RESULTS_CHART_COLORS[index % RESULTS_CHART_COLORS.length]
          const isLeader = leaderIds.has(c.candidate_id)
          return (
            <li key={c.candidate_id}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">#{index + 1}</span>
                  <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                  <span className="font-body-md font-semibold text-on-surface">{c.name}</span>
                  {isLeader ? (
                    <span className="rounded-full bg-tertiary/15 px-2 py-0.5 font-label-sm text-label-sm text-tertiary">
                      {totalVotes > 0 && leaderIds.size === 1 ? 'Leader' : 'Tied'}
                    </span>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="font-headline-md text-headline-md text-on-surface">
                    {c.vote_count.toLocaleString()}
                  </span>
                  <span className="ml-2 font-label-md text-label-md text-on-surface-variant">
                    {c.share_percent}%
                  </span>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${c.share_percent}%`, background: color }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
